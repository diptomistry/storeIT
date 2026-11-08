import { AppFrame } from "@/components/layout/app-frame";
import { SettingsForm } from "@/components/auth/settings-form";
import { getShellContext } from "@/lib/dashboard-data";

export default async function SettingsPage() {
  const data = await getShellContext();

  return (
    <AppFrame
      email={data.user.email}
      fullName={data.profile?.full_name}
      usedBytes={data.usedBytes}
      quotaBytes={data.quotaBytes}
      breadcrumb={[{ id: null, name: "Settings" }]}
      enableSearch={false}
    >
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your profile details.</p>
        </div>
        <SettingsForm email={data.user.email} fullName={data.profile?.full_name ?? ""} />
      </div>
    </AppFrame>
  );
}
