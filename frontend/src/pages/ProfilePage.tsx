import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/useToast";

interface ActivityData {
  total_analyses: number;
  analyses_by_status: Record<string, number>;
  total_trades: number;
  last_login: string | null;
  member_since: string;
}

interface UserProfile {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState<ActivityData | null>(null);

  const fetchActivity = useCallback(async () => {
    try {
      const data = await api.get<ActivityData>("/api/auth/activity");
      setActivity(data);
    } catch (e) {
      console.error("Failed to load activity:", e);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.put<UserProfile>("/api/auth/me", {
        full_name: fullName || undefined,
        email: email || undefined,
        username: username || undefined,
      });
      setUser(updated as never);
      toast({ title: "Profile updated", variant: "success" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update profile";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)", marginBottom: "var(--space-6)" }}>
        Profile
      </h1>

      {/* Edit profile */}
      <Card style={{ marginBottom: "var(--space-6)" }}>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginTop: "var(--space-1)" }} />
              </div>
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" style={{ marginTop: "var(--space-1)" }} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginTop: "var(--space-1)" }} />
            </div>
          </div>
        </CardContent>
        <div style={{ padding: "0 var(--space-6) var(--space-6)", display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </Card>

      {/* Account info */}
      <Card style={{ marginBottom: "var(--space-6)" }}>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", fontSize: "var(--text-sm)" }}>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Status</span>
              <div style={{ marginTop: "var(--space-1)" }}>{user?.is_active ? "Active" : "Inactive"}</div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Account type</span>
              <div style={{ marginTop: "var(--space-1)" }}>{user?.is_superuser ? "Admin" : "User"}</div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Member since</span>
              <div style={{ marginTop: "var(--space-1)" }}>{user?.created_at ? formatDate(user.created_at) : "—"}</div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Last login</span>
              <div style={{ marginTop: "var(--space-1)" }}>{activity?.last_login ? formatDate(activity.last_login) : "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity summary */}
      {activity && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)" }}>
              <StatCard label="Total Analyses" value={activity.total_analyses} />
              <StatCard label="Completed" value={activity.analyses_by_status.completed ?? 0} />
              <StatCard label="Total Trades" value={activity.total_trades} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      padding: "var(--space-4)",
      background: "var(--color-bg-elevated)",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--color-border)",
    }}>
      <div style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-bold)" }}>{value}</div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>{label}</div>
    </div>
  );
}
