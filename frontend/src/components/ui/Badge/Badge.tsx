import { type HTMLAttributes } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant = "default" | "accent" | "success" | "warning" | "error" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge = ({
  variant = "default",
  size = "md",
  dot = false,
  children,
  className = "",
  style,
  ...props
}: BadgeProps) => {
  const classNames = [styles.badge, styles[variant], styles[size], className].filter(Boolean).join(" ");

  return (
    <span className={classNames} style={style} {...props}>
      {dot && <span className={`${styles.dot} ${styles[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
};

Badge.displayName = "Badge";

export default Badge;