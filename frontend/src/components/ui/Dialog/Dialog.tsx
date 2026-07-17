import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Dialog.module.css";

interface DialogContextType {
  isOpen: boolean;
  onClose: () => void;
  setContentRef: (el: HTMLDivElement | null) => void;
  modal: boolean;
}

const DialogContext = createContext<DialogContextType | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within Dialog.Root");
  }
  return context;
}

interface DialogRootProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  modal?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

function DialogRoot({
  isOpen,
  onClose,
  children,
  modal = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: DialogRootProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const setContentRef = useCallback((el: HTMLDivElement | null) => {
    contentRef.current = el;
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!closeOnEscape || e.key !== "Escape") return;
      onClose();
    },
    [closeOnEscape, onClose]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (!closeOnOverlayClick) return;
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (!isOpen || !modal) return;

    const content = contentRef.current;
    if (!content) return;

    const focusableElements = content.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    content.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => {
      content.removeEventListener("keydown", handleTab);
    };
  }, [isOpen, modal]);

  const contextValue: DialogContextType = {
    isOpen,
    onClose,
    setContentRef,
    modal,
  };

  if (!isOpen) return null;

  return (
    <DialogContext.Provider value={contextValue}>
      {createPortal(
        <div
          className={styles.overlay}
          onClick={handleOverlayClick}
          role="presentation"
          aria-hidden="true"
        >
          <div
            ref={setContentRef}
            className={`${styles.content} ${modal ? styles.modal : ""}`}
            role="dialog"
            aria-modal={modal ? "true" : "false"}
            tabIndex={-1}
          >
            {children}
          </div>
        </div>,
        document.body
      )}
    </DialogContext.Provider>
  );
}

DialogRoot.displayName = "Dialog.Root";

interface DialogTriggerProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onClick"> {
  children: ReactNode;
}

function DialogTrigger({ children, className = "", ...props }: DialogTriggerProps) {
  const { isOpen, onClose } = useDialogContext();

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className={`${styles.trigger} ${className}`}
      onClick={onClose}
      {...props}
    >
      {children}
    </button>
  );
}

DialogTrigger.displayName = "Dialog.Trigger";

interface DialogContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "ref"> {
  children: ReactNode;
}

function DialogContent({ children, className = "", ...props }: DialogContentProps) {
  const { setContentRef } = useDialogContext();

  return (
    <div
      ref={setContentRef}
      id="dialog-content"
      className={`${styles.contentInner} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

DialogContent.displayName = "Dialog.Content";

interface DialogCloseProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onClick"> {
  children?: ReactNode;
}

function DialogClose({ children = "Close", className = "", ...props }: DialogCloseProps) {
  const { onClose } = useDialogContext();

  return (
    <button
      type="button"
      className={`${styles.close} ${className}`}
      onClick={onClose}
      {...props}
    >
      {children}
    </button>
  );
}

DialogClose.displayName = "Dialog.Close";

interface DialogTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "id"> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

function DialogTitle({ as: Component = "h2", className = "", ...props }: DialogTitleProps) {
  return <Component id="dialog-title" className={`${styles.title} ${className}`} {...props} />;
}

DialogTitle.displayName = "Dialog.Title";

interface DialogDescriptionProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "id"> {}

function DialogDescription({ className = "", ...props }: DialogDescriptionProps) {
  return <p id="dialog-description" className={`${styles.description} ${className}`} {...props} />;
}

DialogDescription.displayName = "Dialog.Description";

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Close: DialogClose,
  Title: DialogTitle,
  Description: DialogDescription,
};

export type {
  DialogRootProps,
  DialogTriggerProps,
  DialogContentProps,
  DialogCloseProps,
  DialogTitleProps,
  DialogDescriptionProps,
};