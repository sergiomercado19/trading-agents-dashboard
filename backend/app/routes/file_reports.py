from __future__ import annotations

import html
import os
import re
import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse, StreamingResponse

from backend.app.core.config import REPO_ROOT
from backend.app.services.fact_checker import fact_checker

router = APIRouter(prefix="/api", tags=["reports"])

REPORTS_DIR = REPO_ROOT / "reports"

_FOLDER_LABELS = {
    "1_analysts": "Analysts",
    "2_research": "Research",
    "3_trading": "Trading",
    "4_risk": "Risk",
    "5_portfolio": "Portfolio",
}


def _list_report_dirs() -> list[dict]:
    reports = []
    if not REPORTS_DIR.exists():
        return reports
    for d in sorted(REPORTS_DIR.iterdir(), reverse=True):
        if not d.is_dir():
            continue
        report_file = d / "complete_report.md"
        if not report_file.exists():
            continue
        # Parse ticker and date from dir name: TICKER_YYYYMMDD_HHMMSS
        parts = d.name.split("_")
        ticker = parts[0] if parts else d.name
        date_str = "_".join(parts[1:4]) if len(parts) >= 4 else ""
        size = report_file.stat().st_size
        mtime = report_file.stat().st_mtime
        reports.append({
            "id": d.name,
            "ticker": ticker,
            "date": date_str,
            "path": str(d.relative_to(REPO_ROOT)),
            "size_bytes": size,
            "modified": mtime,
        })
    return reports


@router.get("/reports")
async def list_reports():
    return _list_report_dirs()


@router.get("/reports/tree")
async def report_tree(path: str = Query(...)):
    """Return the folder/file hierarchy for a report directory."""
    report_dir = REPO_ROOT / path
    if not report_dir.exists() or not report_dir.is_dir():
        raise HTTPException(status_code=404, detail="Report directory not found")

    sections: list[dict] = []

    # Root-level complete_report.md
    complete = report_dir / "complete_report.md"
    if complete.exists():
        sections.append({
            "label": "Complete Report",
            "path": str(complete.relative_to(REPO_ROOT)),
            "files": [{"name": "complete_report.md", "path": str(complete.relative_to(REPO_ROOT))}],
        })

    # Subdirectories sorted by prefix number
    subdirs = sorted(
        [d for d in report_dir.iterdir() if d.is_dir()],
        key=lambda d: d.name,
    )
    for subdir in subdirs:
        md_files = sorted(subdir.glob("*.md"))
        if not md_files:
            continue
        label = _FOLDER_LABELS.get(subdir.name, subdir.name.replace("_", " ").title())
        sections.append({
            "label": label,
            "path": str(subdir.relative_to(REPO_ROOT)),
            "files": [
                {"name": f.stem.replace("_", " ").title(), "path": str(f.relative_to(REPO_ROOT))}
                for f in md_files
            ],
        })

    return sections


@router.get("/reports/read")
async def read_report(path: str = Query(...)):
    report_path = REPO_ROOT / path
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    if report_path.is_dir():
        # If it's a directory, try to read complete_report.md for backwards compat
        report_file = report_path / "complete_report.md"
        if report_file.exists():
            report_path = report_file
        else:
            raise HTTPException(status_code=404, detail="No complete_report.md found")
    content = report_path.read_text(encoding="utf-8", errors="replace")
    return {"path": path, "content": content}


@router.get("/reports/download")
async def download_report(path: str = Query(...)):
    report_path = REPO_ROOT / path
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    if report_path.is_dir():
        report_file = report_path / "complete_report.md"
        if report_file.exists():
            report_path = report_file
        else:
            raise HTTPException(status_code=404, detail="No complete_report.md found")
    content = report_path.read_bytes()
    filename = report_path.name
    return StreamingResponse(
        iter([content]),
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/reports/delete")
async def delete_report(data: dict):
    path = data.get("path", "")
    if not path:
        raise HTTPException(status_code=400, detail="Path required")
    report_path = REPO_ROOT / path
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    if report_path.is_dir():
        shutil.rmtree(report_path)
    else:
        report_path.unlink()
    return {"status": "deleted", "path": path}


@router.get("/reports/export")
async def export_report(path: str = Query(...), format: str = Query("md")):
    report_path = REPO_ROOT / path
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    if report_path.is_dir():
        report_file = report_path / "complete_report.md"
        if report_file.exists():
            report_path = report_file
        else:
            raise HTTPException(status_code=404, detail="No complete_report.md found")

    content = report_path.read_text(encoding="utf-8", errors="replace")

    if format == "html":
        # Basic markdown to HTML conversion
        html_content = _md_to_html(content)
        return HTMLResponse(content=html_content)
    elif format == "pdf":
        # Return HTML with print-friendly styling (browser can print to PDF)
        html_content = _md_to_html(content)
        wrapped = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Report</title>
<style>body{{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6}}
table{{border-collapse:collapse;width:100%}}th,td{{border:1px solid #ddd;padding:8px;text-align:left}}
th{{background:#f5f5f5}}code{{background:#f0f0f0;padding:2px 4px;border-radius:3px}}
pre{{background:#f0f0f0;padding:12px;border-radius:6px;overflow-x:auto}}</style>
</head><body>{html_content}</body></html>"""
        return HTMLResponse(content=wrapped)
    else:
        return StreamingResponse(
            iter([content.encode()]),
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{report_path.name}"'},
        )


def _md_to_html(md: str) -> str:
    """Simple markdown to HTML converter."""
    lines = md.split("\n")
    html_lines = []
    in_code = False
    in_table = False

    for line in lines:
        if line.strip().startswith("```"):
            if in_code:
                html_lines.append("</code></pre>")
                in_code = False
            else:
                html_lines.append("<pre><code>")
                in_code = True
            continue
        if in_code:
            html_lines.append(html.escape(line))
            continue

        # Table detection
        if "|" in line and line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(set(c) <= set("- :") for c in cells):
                continue  # separator row
            tag = "th" if not in_table else "td"
            if not in_table:
                html_lines.append("<table>")
                in_table = True
            row = "".join(f"<{tag}>{html.escape(c)}</{tag}>" for c in cells)
            html_lines.append(f"<tr>{row}</tr>")
            continue
        elif in_table:
            html_lines.append("</table>")
            in_table = False

        # Headers
        if line.startswith("# "):
            html_lines.append(f"<h1>{html.escape(line[2:])}</h1>")
        elif line.startswith("## "):
            html_lines.append(f"<h2>{html.escape(line[3:])}</h2>")
        elif line.startswith("### "):
            html_lines.append(f"<h3>{html.escape(line[4:])}</h3>")
        elif line.startswith("#### "):
            html_lines.append(f"<h4>{html.escape(line[5:])}</h4>")
        elif line.startswith("- "):
            html_lines.append(f"<li>{html.escape(line[2:])}</li>")
        elif line.strip() == "":
            html_lines.append("<br>")
        else:
            # Bold
            text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html.escape(line))
            # Inline code
            text = re.sub(r'`(.+?)`', r'<code>\1</code>', text)
            html_lines.append(f"<p>{text}</p>")

    if in_table:
        html_lines.append("</table>")
    if in_code:
        html_lines.append("</code></pre>")

    return "\n".join(html_lines)


@router.get("/reports/check_urls")
async def check_report_urls(path: str = Query(...)):
    report_path = REPO_ROOT / path
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    if report_path.is_dir():
        report_file = report_path / "complete_report.md"
        if report_file.exists():
            report_path = report_file
        else:
            raise HTTPException(status_code=404, detail="No complete_report.md found")
    content = report_path.read_text(encoding="utf-8", errors="replace")
    urls = fact_checker.extract_urls(content)
    results = await fact_checker.check_urls(urls[:20])  # Limit to 20 URLs
    return {"urls": [r.model_dump() for r in results]}
