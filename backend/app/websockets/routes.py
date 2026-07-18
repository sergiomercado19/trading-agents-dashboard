from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token, verify_token_type
from app.websockets.manager import ws_manager
from app.models import User

router = APIRouter(prefix="/ws", tags=["websocket"])


async def get_current_user_ws(websocket: WebSocket, token: str) -> Optional[int]:
    """Authenticate WebSocket connection using JWT token."""
    payload = decode_token(token)
    if not payload or not verify_token_type(payload, "access"):
        return None
    user_id = payload.get("sub")
    if isinstance(user_id, str) and user_id.isdigit():
        return int(user_id)
    return user_id if isinstance(user_id, int) else None


@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    user_id = await get_current_user_ws(websocket, token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid authentication token")
        return
    
    # Verify user exists and is active
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        await websocket.close(code=4003, reason="User not found or inactive")
        return
    
    connection = await ws_manager.connect(websocket, user_id)
    
    try:
        # Send welcome message
        await connection.websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "message": "WebSocket connection established"
        })
        
        await ws_manager.handle_connection(connection)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        ws_manager.disconnect(connection)


@router.websocket("/analysis/{analysis_id}")
async def analysis_websocket(
    websocket: WebSocket,
    analysis_id: int,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    user_id = await get_current_user_ws(websocket, token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid authentication token")
        return
    
    # Verify user owns this analysis
    from app.models import Analysis
    result = await db.execute(
        select(Analysis).where(Analysis.id == analysis_id, Analysis.user_id == user_id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        await websocket.close(code=4004, reason="Analysis not found")
        return
    
    connection = await ws_manager.connect(websocket, user_id)
    await ws_manager.subscribe(connection, f"analysis:{analysis_id}")
    
    try:
        await connection.websocket.send_json({
            "type": "analysis_connected",
            "analysis_id": analysis_id,
            "status": analysis.status.value
        })
        
        await ws_manager.handle_connection(connection)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Analysis WebSocket error: {e}")
    finally:
        ws_manager.disconnect(connection)


import logging
logger = logging.getLogger(__name__)