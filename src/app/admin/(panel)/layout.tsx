import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <div className="min-h-dvh bg-ink">
      <AdminNav name={admin.name} role={admin.role} />
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:pb-12">{children}</main>
    </div>
  );
}
