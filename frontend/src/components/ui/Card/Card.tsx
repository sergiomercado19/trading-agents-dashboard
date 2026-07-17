import { type HTMLAttributes, type ReactNode } from "react";
import styles from "./Card.module.css";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = ({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) => {
  const classNames = [styles.card, styles[variant], styles[padding], className].filter(Boolean).join(" ");

  return <div className={classNames} {...props}>{children}</div>;
};

Card.displayName = "Card";

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export const CardHeader = ({ title, subtitle, action, className = "", children, ...props }: CardHeaderProps) => {
  const classNames = [styles.header, className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...props}>
      {children || (
        <>
          <div className={styles.headerContent}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </>
      )}
    </div>
  );
};

CardHeader.displayName = "CardHeader";

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const CardBody = ({ className = "", ...props }: CardBodyProps) => {
  const classNames = [styles.body, className].filter(Boolean).join(" ");
  return <div className={classNames} {...props} />;
};

CardBody.displayName = "CardBody";

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = ({ className = "", ...props }: CardFooterProps) => {
  const classNames = [styles.footer, className].filter(Boolean).join(" ");
  return <div className={classNames} {...props} />;
};

CardFooter.displayName = "CardFooter";

export default Card;