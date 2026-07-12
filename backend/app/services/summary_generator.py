from __future__ import annotations

from backend.app.models.schemas import RunSnapshot


class SummaryGenerator:
    """Generate a structured summary from a completed run's state."""

    def generate(self, run: RunSnapshot) -> str:
        sections = []

        sections.append(f"# Analysis Report: {run.ticker}")
        sections.append(f"**Date:** {run.date}  ")
        sections.append(f"**Status:** {run.status}  ")
        if run.ended and run.started:
            elapsed = run.ended - run.started
            sections.append(f"**Elapsed:** {elapsed:.1f}s  ")
        sections.append(f"**Cost:** ${run.stats.cost_usd:.4f}  ")
        sections.append(f"**Tokens:** {run.stats.tokens_in:,} in / {run.stats.tokens_out:,} out  ")
        sections.append("")

        if run.decision:
            sections.append("## Decision")
            sections.append(run.decision)
            sections.append("")

        if run.reports:
            sections.append("## Reports")
            for key, content in run.reports.items():
                title = key.replace("_", " ").title()
                sections.append(f"### {title}")
                sections.append(content)
                sections.append("")

        if run.agents:
            sections.append("## Agent Status")
            for agent, status in run.agents.items():
                icon = {"completed": "\u2705", "error": "\u274c", "running": "\u23f3"}.get(status, "\u25fb")
                sections.append(f"- {icon} **{agent}**: {status}")
            sections.append("")

        return "\n".join(sections)


summary_generator = SummaryGenerator()
