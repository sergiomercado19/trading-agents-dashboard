import { useReportReader } from "../../hooks/useReportReader";
import { DocumentIcon } from "../icons";
import { Button } from "../ui/button";
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

export default function ReportReader({ content, onExport, fileTree, selectedFile, onSelectFile }: Props) {
  const { html } = useReportReader(content);

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