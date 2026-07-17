import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newNotification: Notification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove after duration (default 5s)
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "var(--space-4)",
        right: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationToast({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const typeStyles: Record<NotificationType, { bg: string; border: string; icon: string }> = {
    info: { bg: "var(--color-accent-subtle)", border: "var(--color-accent)", icon: "ℹ" },
    success: { bg: "var(--color-success-subtle)", border: "var(--color-success)", icon: "✓" },
    warning: { bg: "var(--color-warning-subtle)", border: "var(--color-warning)", icon: "⚠" },
    error: { bg: "var(--color-error-subtle)", border: "var(--color-error)", icon: "✕" },
  };

  const style = typeStyles[notification.type];

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        minWidth: 300,
        maxWidth: 400,
        animation: "slideInRight var(--duration-normal) var(--ease-out)",
      }}
    >
      <span style={{ fontSize: "var(--text-lg)", color: style.border, flexShrink: 0 }}>{style.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
          {notification.title}
        </div>
        {notification.message && (
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
            {notification.message}
          </div>
        )}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            style={{
              marginTop: "var(--space-2)",
              padding: "var(--space-1) var(--space-2)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-medium)",
              color: style.border,
              background: "transparent",
              border: `1px solid ${style.border}`,
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          padding: "var(--space-1)",
          color: "var(--color-text-muted)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "var(--text-lg)",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}