import { useState, useEffect, useMemo } from "react";

interface Props {
  content: string;
  onExport?: (fmt: string) => void;
}

interface TocItem {
  level: number;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ReportReader({ content, onExport }: Props) {
  const [activeId, setActiveId] = useState("");

  const toc = useMemo(() => {
    const items: TocItem[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^(#{1,4})\s+(.+)/);
      if (match) {
        const level = match[1]!.length;
        const text = match[2]!.trim();
        items.push({ level, text, id: slugify(text) });
      }
    }
    return items;
  }, [content]);

  const html = useMemo(() => {
    return mdToHtml(content);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    const headings = document.querySelectorAll(".report-content h1, .report-content h2, .report-content h3, .report-content h4");
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [html]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ display: "flex", gap: 0, height: "100%" }}>
      {/* TOC sidebar */}
      <div
        style={{
          width: 220,
          minWidth: 220,
          borderRight: "1px solid var(--border)",
          padding: "12px 8px",
          overflowY: "auto",
          fontSize: 12,
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
          Contents
        </div>
        {toc.map((item, i) => (
          <div
            key={i}
            onClick={() => scrollTo(item.id)}
            style={{
              paddingLeft: (item.level - 1) * 10,
              padding: `${3 + (item.level - 1) * 2}px ${(item.level - 1) * 10}px`,
              cursor: "pointer",
              color: activeId === item.id ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: activeId === item.id ? 600 : 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Export bar */}
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "8px 16px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-secondary)",
          }}
        >
          {["md", "html", "pdf"].map((fmt) => (
            <button
              key={fmt}
              onClick={() => onExport?.(fmt)}
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                color: "var(--text-primary)",
                padding: "3px 10px",
                cursor: "pointer",
                fontSize: 11,
                textTransform: "uppercase",
              }}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Report body */}
        <div
          className="report-content"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 28px",
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--text-primary)",
          }}
        />
      </div>
    </div>
  );
}

function mdToHtml(md: string): string {
  let html = "";
  const lines = md.split("\n");
  let inCode = false;
  let inTable = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        html += "</code></pre>";
        inCode = false;
      } else {
        html += "<pre><code>";
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html += escapeHtml(line) + "\n";
      continue;
    }

    // Table
    if (line.includes("|") && line.trim().startsWith("|")) {
      const cells = line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => /^[\s\-:]+$/.test(c))) continue; // separator
      const tag = !inTable ? "th" : "td";
      if (!inTable) {
        html += '<table style="border-collapse:collapse;width:100%;margin:12px 0">';
        inTable = true;
      }
      html += "<tr>" + cells.map((c) => `<${tag} style="border:1px solid var(--border);padding:6px 10px;text-align:left">${fmtInline(c)}</${tag}>`).join("") + "</tr>";
      continue;
    } else if (inTable) {
      html += "</table>";
      inTable = false;
    }

    // Headers with IDs
    const hMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1]!.length;
      const id = slugify(hMatch[2]!);
      html += `<h${level} id="${id}" style="margin:18px 0 8px;font-size:${20 - level * 2}px;color:var(--text-primary)">${fmtInline(hMatch[2]!)}</h${level}>`;
      continue;
    }

    // List items
    if (line.startsWith("- ")) {
      html += `<li style="margin:2px 0;padding-left:4px">${fmtInline(line.slice(2))}</li>`;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      html += `<blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:8px 0;color:var(--text-secondary);font-style:italic">${fmtInline(line.slice(2))}</blockquote>`;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      html += "<br>";
      continue;
    }

    // Paragraph
    html += `<p style="margin:6px 0">${fmtInline(line)}</p>`;
  }

  if (inTable) html += "</table>";
  if (inCode) html += "</code></pre>";
  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtInline(s: string): string {
  let t = escapeHtml(s);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
  t = t.replace(/`(.+?)`/g, '<code style="background:var(--bg-tertiary);padding:1px 4px;border-radius:3px;font-size:13px">$1</code>');
  t = t.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:var(--accent)">$1</a>');
  return t;
}
