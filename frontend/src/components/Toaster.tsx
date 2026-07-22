import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/ThemeProvider";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme === "terminal" || theme === "bloomberg" ? "dark" : "light"}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "group toast bg-background text-foreground border border-border shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
    />
  );
}
