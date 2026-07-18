import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field

from fastapi import WebSocket, WebSocketDisconnect
from app.core.config import settings


logger = logging.getLogger(__name__)


@dataclass
class Connection:
    websocket: WebSocket
    user_id: int
    subscriptions: Set[str] = field(default_factory=set)


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[int, List[Connection]] = {}
        self.user_connections: Dict[int, Set[Connection]] = {}
        self._heartbeat_task: Optional[asyncio.Task] = None
        self.heartbeat_interval = settings.ws_heartbeat_interval

    async def connect(self, websocket: WebSocket, user_id: int) -> Connection:
        await websocket.accept()
        connection = Connection(websocket=websocket, user_id=user_id)
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(connection)
        
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection)
        
        logger.info(f"WebSocket connected: user_id={user_id}, total_connections={self.get_connection_count()}")
        return connection

    def disconnect(self, connection: Connection):
        user_id = connection.user_id
        
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                c for c in self.active_connections[user_id] if c != connection
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(connection)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        logger.info(f"WebSocket disconnected: user_id={user_id}")

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.user_connections:
            dead_connections = []
            for connection in self.user_connections[user_id]:
                try:
                    await connection.websocket.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send to user {user_id}: {e}")
                    dead_connections.append(connection)
            
            for conn in dead_connections:
                self.disconnect(conn)

    async def broadcast(self, message: dict, exclude_user: Optional[int] = None):
        for user_id, connections in self.user_connections.items():
            if exclude_user and user_id == exclude_user:
                continue
            
            for connection in connections:
                try:
                    await connection.websocket.send_json(message)
                except Exception as e:
                    logger.warning(f"Broadcast failed to user {user_id}: {e}")

    async def send_to_subscribers(self, topic: str, message: dict):
        for user_id, connections in self.user_connections.items():
            for connection in connections:
                if topic in connection.subscriptions:
                    try:
                        await connection.websocket.send_json(message)
                    except Exception as e:
                        logger.warning(f"Failed to send to subscriber {user_id}: {e}")

    def subscribe(self, connection: Connection, topic: str):
        connection.subscriptions.add(topic)

    def unsubscribe(self, connection: Connection, topic: str):
        connection.subscriptions.discard(topic)

    async def handle_connection(self, connection: Connection):
        try:
            while True:
                data = await connection.websocket.receive_text()
                try:
                    message = json.loads(data)
                    await self.handle_message(connection, message)
                except json.JSONDecodeError:
                    await connection.websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON"
                    })
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            self.disconnect(connection)

    async def handle_message(self, connection: Connection, message: dict):
        msg_type = message.get("type")
        
        if msg_type == "ping":
            await connection.websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
        
        elif msg_type == "subscribe":
            topic = message.get("topic")
            if topic:
                self.subscribe(connection, topic)
                await connection.websocket.send_json({
                    "type": "subscribed",
                    "topic": topic
                })
        
        elif msg_type == "unsubscribe":
            topic = message.get("topic")
            if topic:
                self.unsubscribe(connection, topic)
                await connection.websocket.send_json({
                    "type": "unsubscribed",
                    "topic": topic
                })
        
        else:
            await connection.websocket.send_json({
                "type": "error",
                "message": f"Unknown message type: {msg_type}"
            })

    def get_connection_count(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())

    def get_user_connection_count(self, user_id: int) -> int:
        return len(self.user_connections.get(user_id, set()))

    async def start_heartbeat(self):
        if self._heartbeat_task is None or self._heartbeat_task.done():
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

    async def stop_heartbeat(self):
        if self._heartbeat_task and not self._heartbeat_task.done():
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass

    async def _heartbeat_loop(self):
        while True:
            await asyncio.sleep(self.heartbeat_interval)
            await self._send_heartbeat()

    async def _send_heartbeat(self):
        message = {
            "type": "heartbeat",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        dead_connections = []
        
        for user_id, connections in self.user_connections.items():
            for connection in connections:
                try:
                    await connection.websocket.send_json(message)
                except Exception:
                    dead_connections.append(connection)
        
        for conn in dead_connections:
            self.disconnect(conn)


ws_manager = WebSocketManager()