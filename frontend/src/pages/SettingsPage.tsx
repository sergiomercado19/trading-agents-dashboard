import { SettingsProvider, useSettings } from "./settings/SettingsContext";
import { GeneralSection } from "./settings/GeneralSection";
import { ApiKeysSection } from "./settings/ApiKeysSection";
import { SystemSection } from "./settings/SystemSection";
import { SECTIONS } from "./settings/SettingsConstants";
import { GeneralIcon, ApiKeysIcon, SystemIcon } from "../components/icons";

function SettingsSidebar() {
  const { activeSection, setActiveSection, health, loading } = useSettings();

  if (loading) return null;

  const healthOk = health && (health.status === "ok" || health.status === "degraded");

  return (
    <nav
      style={{
        width: 200,
        minWidth: 200,
        borderRight: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-surface)",
        padding: "var(--space-4) 0",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
      }}
    >
      <div
        style={{
          padding: "0 var(--space-5) var(--space-4)",
          fontSize: "var(--text-md)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--color-text-primary)",
        }}
      >
        Settings
      </div>
      {SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              width: "100%",
              padding: "var(--space-2) var(--space-5)",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
              fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
              textAlign: "left",
              transition: "all var(--duration-fast) var(--ease-out)",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = "var(--color-bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: 16,
                  borderRadius: "0 2px 2px 0",
                  background: "var(--color-accent)",
                }}
              />
            )}
            {section.id === "general" && <GeneralIcon />}
            {section.id === "api-keys" && <ApiKeysIcon />}
            {section.id === "system" && <SystemIcon />}
            {section.label}
            {section.id === "system" && healthOk === false && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--color-error)",
                  marginLeft: "auto",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function SettingsContent() {
  const { activeSection, saved, handleSaveAll } = useSettings();

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
      <div style={{ maxWidth: 680 }}>
        {activeSection === "general" && <GeneralSection />}
        {activeSection === "api-keys" && <ApiKeysSection />}
        {activeSection === "system" && <SystemSection />}

        {/* Save bar */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            display: "flex",
            justifyContent: "flex-end",
            padding: "var(--space-4) 0",
            marginTop: "var(--space-6)",
            borderTop: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg-root)",
          }}
        >
          <button
            onClick={handleSaveAll}
            className="btn btn-primary"
            style={{
              padding: "var(--space-2) var(--space-6)",
              background: saved ? "var(--color-success)" : undefined,
            }}
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsLayout() {
  const { loading } = useSettings();

  if (loading) {
    return (
      <div style={{ padding: "var(--space-6)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <SettingsSidebar />
      <SettingsContent />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsLayout />
    </SettingsProvider>
  );
}