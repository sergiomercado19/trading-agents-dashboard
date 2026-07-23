import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/utils/api";
import { toast } from "sonner";

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
      toast.success("Profile updated");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update profile";
      toast.error(message);
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
    <div className="p-6 max-w-[720px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Profile
      </h1>

      {/* Edit profile */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
          </div>
        </CardContent>
        <div className="px-6 pb-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </Card>

      {/* Account info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-c-text-muted">Status</span>
              <div className="mt-1">{user?.is_active ? "Active" : "Inactive"}</div>
            </div>
            <div>
              <span className="text-c-text-muted">Account type</span>
              <div className="mt-1">{user?.is_superuser ? "Admin" : "User"}</div>
            </div>
            <div>
              <span className="text-c-text-muted">Member since</span>
              <div className="mt-1">{user?.created_at ? formatDate(user.created_at) : "—"}</div>
            </div>
            <div>
              <span className="text-c-text-muted">Last login</span>
              <div className="mt-1">{activity?.last_login ? formatDate(activity.last_login) : "—"}</div>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
    <div className="p-4 bg-c-bg-elevated rounded-md border border-c-border">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-c-text-muted mt-1">{label}</div>
    </div>
  );
}
