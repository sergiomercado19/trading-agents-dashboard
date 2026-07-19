from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from app.agents import PHASE_ORDER, PHASE_AGENTS, get_agent
from app.schemas.analysis import AgentOutput
from app.services.perplefina import fetch_agent_context, AGENT_FOCUS_MODE

logger = logging.getLogger(__name__)

TOTAL_AGENTS = 13


class WorkflowEngine:
    """Orchestrates the multi-agent analysis workflow.

    Runs agents phase-by-phase. Within each phase, agents run concurrently.
    Each phase's agents receive the accumulated context from all prior phases.
    """

    def __init__(self, provider: str = "openai", model: str = "gpt-4o-mini"):
        self.provider = provider
        self.model = model

    async def run(
        self,
        ticker: str,
        event_queue: asyncio.Queue,
        analysis_id: int,
        selected_analysts: list[str] | None = None,
        date: str = "",
    ) -> dict[str, Any]:
        """Run the full workflow, posting events to *event_queue*.

        Returns a dict with keys: outputs, recommendation, confidence, risk_score, summary.
        """
        context: dict[str, Any] = {"date": date}
        all_outputs: list[AgentOutput] = []
        completed_count = 0

        for phase in PHASE_ORDER:
            agent_names = PHASE_AGENTS[phase]
            if phase == "data_analysis" and selected_analysts:
                agent_names = [a for a in agent_names if a.replace("_analyst", "") in selected_analysts
                               or a in selected_analysts]

            # Pre-fetch Perplefina context for data_analysis agents
            if phase == "data_analysis":
                await self._fetch_perplefina_context(ticker, agent_names, context, date)

            # Notify phase start
            await event_queue.put({
                "type": "phase_start",
                "analysis_id": analysis_id,
                "phase": phase,
                "agents": agent_names,
            })

            # Run agents within the phase concurrently
            tasks = []
            for agent_name in agent_names:
                agent = get_agent(agent_name, provider=self.provider, model=self.model)
                tasks.append(self._run_agent(agent, ticker, context, analysis_id, event_queue))

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, Exception):
                    logger.exception("Agent task failed: %s", result)
                    continue
                if result is None:
                    continue

                output: AgentOutput = result
                all_outputs.append(output)
                completed_count += 1

                # Store output in context for downstream agents
                context[f"{output.agent_name}_output"] = output.content

                # Aggregate phase-specific context
                self._update_context(context, output, phase)

                # Emit progress
                await event_queue.put({
                    "type": "progress",
                    "analysis_id": analysis_id,
                    "phase": phase,
                    "progress": int((completed_count / TOTAL_AGENTS) * 100),
                    "total_agents": TOTAL_AGENTS,
                    "completed_agents": completed_count,
                })

        # Build final results
        return self._build_result(all_outputs, context, ticker)

    async def _run_agent(
        self,
        agent,
        ticker: str,
        context: dict[str, Any],
        analysis_id: int,
        event_queue: asyncio.Queue,
    ) -> AgentOutput | None:
        # Notify agent started
        await event_queue.put({
            "type": "agent_update",
            "analysis_id": analysis_id,
            "agent": agent.name,
            "phase": agent.phase,
            "status": "running",
            "message": f"Starting {agent.name}...",
        })

        output = await agent.run(ticker, context)

        status = "completed" if not output.metadata.get("error") else "failed"
        message = output.content[:200] if output.content else output.metadata.get("error", "")

        await event_queue.put({
            "type": "agent_update",
            "analysis_id": analysis_id,
            "agent": agent.name,
            "phase": agent.phase,
            "status": status,
            "message": message,
            "duration_ms": output.duration_ms,
            "tokens_used": output.tokens_used,
        })

        return output

    def _update_context(self, context: dict, output: AgentOutput, phase: str) -> None:
        if phase == "data_analysis":
            reports = context.get("data_reports", "")
            context["data_reports"] = reports + f"\n\n## {output.agent_name}\n{output.content}"
        elif phase == "research":
            research = context.get("research_output", "")
            context["research_output"] = research + f"\n\n## {output.agent_name}\n{output.content}"
        elif phase == "trading":
            context["trading_plan"] = output.content
        elif phase == "risk":
            risk_reports = context.get("risk_reports", "")
            context["risk_reports"] = risk_reports + f"\n\n## {output.agent_name}\n{output.content}"
            context["risk_assessment"] = context["risk_reports"]

    async def _fetch_perplefina_context(
        self,
        ticker: str,
        agent_names: list[str],
        context: dict[str, Any],
        date: str,
    ) -> None:
        """Fetch Perplefina web context concurrently for all data_analysis agents."""
        perplefina_agents = [a for a in agent_names if a in AGENT_FOCUS_MODE]
        if not perplefina_agents:
            return

        tasks = {
            name: fetch_agent_context(ticker, name, date)
            for name in perplefina_agents
        }
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)

        for name, result in zip(tasks.keys(), results):
            if isinstance(result, Exception):
                logger.warning("Perplefina fetch failed for %s: %s", name, result)
                context[f"{name}_web_data"] = ""
            else:
                context[f"{name}_web_data"] = result

    def _build_result(
        self, outputs: list[AgentOutput], context: dict, ticker: str
    ) -> dict[str, Any]:
        # Extract portfolio manager output for final decision
        pm_output = next((o for o in outputs if o.agent_name == "portfolio_manager"), None)
        recommendation = ""
        confidence = 0.0
        risk_score = 0.0
        summary = ""

        if pm_output and pm_output.content:
            content = pm_output.content
            summary = content
            rec_lower = content.lower()
            if "buy" in rec_lower.split("\n")[0]:
                recommendation = "BUY"
            elif "sell" in rec_lower.split("\n")[0]:
                recommendation = "SELL"
            else:
                recommendation = "HOLD"

            # Try to extract confidence and risk scores
            for line in content.split("\n"):
                lower = line.lower()
                if "confidence" in lower and "%" in lower:
                    try:
                        confidence = float(line.split("%")[0].split()[-1]) / 100
                    except (ValueError, IndexError):
                        pass
                if "risk" in lower and "score" in lower and "%" in lower:
                    try:
                        risk_score = float(line.split("%")[0].split()[-1]) / 100
                    except (ValueError, IndexError):
                        pass

        return {
            "ticker": ticker,
            "recommendation": recommendation or "HOLD",
            "confidence": confidence,
            "risk_score": risk_score,
            "summary": summary[:2000],
            "agents": [
                {
                    "name": o.agent_name,
                    "phase": o.phase,
                    "content": o.content,
                    "duration_ms": o.duration_ms,
                    "tokens_used": o.tokens_used,
                    "status": "completed" if not o.metadata.get("error") else "failed",
                }
                for o in outputs
            ],
        }
