import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Logo";
import { BRAND } from "@/config/brand";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion administrateur", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="court-bg flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <Logo size={88} className="mx-auto" />
        <h1 className="mt-4 font-display text-4xl tracking-wide">{BRAND.name}</h1>
        <p className="eyebrow mt-1">Espace administrateur</p>
      </div>
      <LoginForm />
    </main>
  );
}
