import { useEffect, useMemo } from "react";
import { DocumentIcon } from "../icons";
import { Button } from "../ui";
import styles from "./ReportReader.module.css";

interface ReportFile {
  name: string;
  path: string;
}

interface ReportSection {
  label: string;
  path: string;
  files: ReportFile[];
}

interface Props {
  content: string;
  onExport?: (fmt: string) => void;
  fileTree?: ReportSection[];
  selectedFile?: ReportFile | null;
  onSelectFile?: (file: ReportFile) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ReportReader({ content, onExport, fileTree, selectedFile, onSelectFile }: Props) {
  const html = useMemo(() => {
    return mdToHtml(content);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const heading = entry.target as HTMLElement;
            const id = heading.getAttribute("id");
            if (id) {
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    const headings = document.querySelectorAll(".report-content h1, .report-content h2, .report-content h3, .report-content h4");
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [html]);

  return (
    <div className={styles.reportReader}>
      {/* File tree sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Contents</div>
        {fileTree?.map((section) => {
          const isCompleteReport = section.label === "Complete Report" && section.files.length === 1;
          const completeFile = isCompleteReport ? section.files[0] : null;
          const isActive = completeFile && selectedFile?.path === completeFile.path;

          if (isCompleteReport && completeFile) {
            return (
              <div key={section.path} className={styles.section}>
                <button
                  onClick={() => onSelectFile?.(completeFile)}
                  className={`${styles.completeReport} ${isActive ? styles.active : ""}`}
                >
                  <DocumentIcon width={14} height={14} className={styles.icon} />
                  Complete Report
                </button>
              </div>
            );
          }

          return (
            <div key={section.path} className={styles.section}>
              <div className={styles.sectionLabel}>{section.label}</div>
              <div className={styles.fileList}>
                {section.files.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => onSelectFile?.(file)}
                    className={`${styles.fileItem} ${selectedFile?.path === file.path ? styles.active : ""}`}
                  >
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {(!fileTree || fileTree.length === 0) && (
          <div className={styles.empty}>No files available</div>
        )}
      </div>

      {/* Content */}
      <div className={styles.contentArea}>
        {/* Export bar */}
        <div className={styles.exportBar}>
          {["md", "html", "pdf"].map((fmt) => (
            <Button
              key={fmt}
              variant="ghost"
              size="sm"
              onClick={() => onExport?.(fmt)}
              className={styles.exportButton}
            >
              {fmt}
            </Button>
          ))}
        </div>

        {/* Report body */}
        <div className={`${styles.reportContent} report-content`} dangerouslySetInnerHTML={{ __html: html }} />
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
      html += "<tr>" + cells.map((c) => `<${tag} style="border:1px solid var(--color-border);padding:6px 10px;text-align:left">${fmtInline(c)}</${tag}>`).join("") + "</tr>";
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
      html += `<h${level} id="${id}" style="margin:18px 0 8px;font-size:${20 - level * 2}px;color:var(--color-text-primary)">${fmtInline(hMatch[2]!)}</h${level}>`;
      continue;
    }

    // List items
    if (line.startsWith("- ")) {
      html += `<li style="margin:2px 0;padding-left:4px">${fmtInline(line.slice(2))}</li>`;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      html += `<blockquote style="border-left:3px solid var(--color-accent);padding-left:12px;margin:8px 0;color:var(--color-text-secondary);font-style:italic">${fmtInline(line.slice(2))}</blockquote>`;
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
  return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}

function fmtInline(s: string): string {
  let t = escapeHtml(s);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
  t = t.replace(/`(.+?)`/g, '<code style="background:var(--color-bg-elevated);padding:1px 4px;border-radius:3px;font-size:13px">$1</code>');
  t = t.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:var(--color-accent)">$1</a>');
  return t;
}