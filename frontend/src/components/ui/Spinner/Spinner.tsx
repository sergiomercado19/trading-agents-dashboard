import { type HTMLAttributes } from "react";
import styles from "./Spinner.module.css";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  label?: string;
}

export const Spinner = ({ size = "md", label = "Loading", className = "", ...props }: SpinnerProps) => {
  const classNames = [styles.spinner, styles[size], className].filter(Boolean).join(" ");

  return (
    <div className={classNames} role="status" aria-live="polite" {...props}>
      <svg className={styles.circle} viewBox="0 0 50 50" aria-hidden="true">
        <circle className={styles.path} cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
      </svg>
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
};

Spinner.displayName = "Spinner";

export interface SpinnerOverlayProps extends HTMLAttributes<HTMLDivElement> {
  isVisible: boolean;
  size?: SpinnerSize;
  label?: string;
}

export const SpinnerOverlay = ({ isVisible, size = "md", label = "Loading", className = "", children, ...props }: SpinnerOverlayProps) => {
  if (!isVisible) return <>{children}</>;

  const classNames = [styles.overlay, className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...props}>
      {children}
      <div className={styles.overlayContent}>
        <Spinner size={size} label={label} />
      </div>
    </div>
  );
};

SpinnerOverlay.displayName = "SpinnerOverlay";

export default Spinner;