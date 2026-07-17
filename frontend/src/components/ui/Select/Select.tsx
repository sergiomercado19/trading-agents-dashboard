import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";
import styles from "./Select.module.css";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      placeholder,
      id,
      className = "",
      disabled,
      required,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint ? `${selectId}-hint` : undefined;

    const classNames = [
      styles.select,
      fullWidth ? styles.fullWidth : "",
      error ? styles.hasError : "",
      disabled ? styles.disabled : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const wrapperClassNames = [styles.wrapper, fullWidth ? styles.fullWidth : ""]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}
        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            id={selectId}
            className={classNames}
            disabled={disabled}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={`${errorId || ""} ${hintId || ""}`.trim() || undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <span className={styles.chevron} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
        {error && <p id={errorId} className={styles.error} role="alert">{error}</p>}
        {hint && !error && <p id={hintId} className={styles.hint}>{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export interface OptionProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
}

export const Option = ({ value, children, disabled }: OptionProps) => (
  <option value={value} disabled={disabled}>
    {children}
  </option>
);

Option.displayName = "Option";