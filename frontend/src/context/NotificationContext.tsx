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
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[9999] pointer-events-none">
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
    info: { bg: "var(--color-accent-subtle, oklch(0.62 0.17 255 / 0.12))", border: "var(--color-accent)", icon: "ℹ" },
    success: { bg: "var(--color-success-subtle, oklch(0.72 0.19 155 / 0.12))", border: "var(--color-success)", icon: "✓" },
    warning: { bg: "var(--color-warning-subtle, oklch(0.82 0.17 85 / 0.12))", border: "var(--color-warning)", icon: "⚠" },
    error: { bg: "var(--color-error-subtle)", border: "var(--color-error)", icon: "✕" },
  };

  const style = typeStyles[notification.type];

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 py-3 px-4 rounded-md shadow-lg min-w-[300px] max-w-panel animate-[slideInRight_var(--duration-normal)_var(--ease-out)]"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      <span className="text-lg shrink-0" style={{ color: style.border }}>{style.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-c-text-primary">
          {notification.title}
        </div>
        {notification.message && (
          <div className="text-sm text-c-text-secondary mt-1">
            {notification.message}
          </div>
        )}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 py-1 px-2 text-xs font-medium bg-transparent rounded-sm cursor-pointer"
            style={{
              color: style.border,
              border: `1px solid ${style.border}`,
            }}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-1 text-c-text-muted bg-transparent border-none cursor-pointer text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
