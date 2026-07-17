import { type HTMLAttributes } from "react";
import styles from "./Skeleton.module.css";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton = ({
  variant = "text",
  width,
  height,
  animation = "pulse",
  className = "",
  style,
  ...props
}: SkeletonProps) => {
  const classNames = [styles.skeleton, styles[variant], styles[animation], className].filter(Boolean).join(" ");

  const inlineStyle = {
    ...style,
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
  } as React.CSSProperties;

  return <div className={classNames} style={inlineStyle} {...props} />;
};

Skeleton.displayName = "Skeleton";

export interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  showAction?: boolean;
  className?: string;
}

export const SkeletonCard = ({ lines = 3, showAvatar = true, showAction = false, className = "" }: SkeletonCardProps) => {
  const classNames = [styles.card, className].filter(Boolean).join(" ");

  return (
    <div className={classNames}>
      <div className={styles.cardHeader}>
        {showAvatar && <Skeleton variant="circular" width={40} height={40} className={styles.avatar} />}
        <div className={styles.cardMeta}>
          <Skeleton variant="text" width="60%" height={16} className={styles.title} />
          <Skeleton variant="text" width="40%" height={12} className={styles.subtitle} />
        </div>
      </div>
      <div className={styles.cardBody}>
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} variant="text" width={i === lines - 1 ? "70%" : "100%"} height={14} className={styles.line} />
        ))}
      </div>
      {showAction && (
        <div className={styles.cardFooter}>
          <Skeleton variant="rectangular" width={100} height={36} className={styles.action} />
        </div>
      )}
    </div>
  );
};

SkeletonCard.displayName = "SkeletonCard";

export default Skeleton;