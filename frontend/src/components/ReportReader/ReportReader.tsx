import { useReportReader } from "../../hooks/useReportReader";
import { DocumentIcon } from "../icons";
import { Button } from "../ui/button";
import { cn } from "@/utils/cn";

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

export default function ReportReader({ content, onExport, fileTree, selectedFile, onSelectFile }: Props) {
  const { html } = useReportReader(content);

  return (
    <div className="flex gap-0 h-full">
      {/* File tree sidebar */}
      <div className="w-[220px] min-w-[220px] border-r border-c-border p-3 px-2 overflow-y-auto text-xs bg-c-bg-surface">
        <div className="font-semibold mb-2 text-c-text-primary text-xs">Contents</div>
        {fileTree?.map((section) => {
          const isCompleteReport = section.label === "Complete Report" && section.files.length === 1;
          const completeFile = isCompleteReport ? section.files[0] : null;
          const isActive = completeFile && selectedFile?.path === completeFile.path;

          if (isCompleteReport && completeFile) {
            return (
              <div key={section.path} className="mb-3">
                <button
                  onClick={() => onSelectFile?.(completeFile)}
                  className={cn(
                    "flex items-center gap-2 w-full py-2.5 px-3 rounded-md cursor-pointer font-semibold text-sm font-mono tracking-wide transition-all border",
                    isActive
                      ? "bg-c-accent border-c-accent text-white shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                      : "bg-c-bg-elevated border-c-border text-c-text-primary hover:bg-c-bg-hover hover:border-c-accent"
                  )}
                >
                  <DocumentIcon width={14} height={14} className="w-3.5 h-3.5 shrink-0" />
                  Complete Report
                </button>
              </div>
            );
          }

          return (
            <div key={section.path} className="mb-3">
              <div className="text-[10px] font-semibold text-c-text-muted uppercase tracking-[0.05em] py-1 px-2 mb-1">{section.label}</div>
              <div className="flex flex-col gap-0.5">
                {section.files.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => onSelectFile?.(file)}
                    className={cn(
                      "py-1 px-2 rounded cursor-pointer mb-0.5 bg-transparent border border-transparent text-c-text-secondary font-normal whitespace-nowrap overflow-hidden text-ellipsis transition-all",
                      selectedFile?.path === file.path
                        ? "bg-c-bg-elevated border-c-accent text-c-accent font-semibold"
                        : "hover:bg-c-bg-hover"
                    )}
                  >
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {(!fileTree || fileTree.length === 0) && (
          <div className="text-c-text-muted text-[11px]">No files available</div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Export bar */}
        <div className="flex gap-1.5 py-2 px-4 border-b border-c-border bg-c-bg-surface">
          {["md", "html", "pdf"].map((fmt) => (
            <Button
              key={fmt}
              variant="ghost"
              size="sm"
              onClick={() => onExport?.(fmt)}
              className="bg-c-bg-elevated border border-c-border rounded text-c-text-primary py-0.5 px-2.5 cursor-pointer text-[11px] uppercase transition-all hover:bg-c-bg-hover hover:border-c-accent"
            >
              {fmt}
            </Button>
          ))}
        </div>

        {/* Report body */}
        <div className="flex-1 overflow-y-auto py-5 px-7 text-sm leading-relaxed text-c-text-primary report-content" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
