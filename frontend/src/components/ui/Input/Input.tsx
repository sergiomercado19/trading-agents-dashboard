import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, placeholder, leftIcon, rightIcon, className, id, disabled, required, ...props }, ref) => {
    const errorId = error ? `${id}-error` : undefined;
    const hintId = hint && !error ? `${id}-hint` : undefined;

    return (
      <div className={`${styles.wrapper} ${className || ""}`}>
        {label && <label htmlFor={id} className={styles.label}>{label}</label>}
        <div className={styles.inputContainer}>
          {leftIcon && <span className={styles.icon} aria-hidden="true">{leftIcon}</span>}
          <input
            ref={ref}
            id={id}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={`${errorId || ""} ${hintId || ""}`.trim() || undefined}
            className={styles.input}
            {...props}
          />
          {rightIcon && <span className={styles.icon} aria-hidden="true">{rightIcon}</span>}
        </div>
        {error && <p id={errorId} className={styles.error} role="alert">{error}</p>}
        {hint && !error && <p id={hintId} className={styles.hint}>{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;