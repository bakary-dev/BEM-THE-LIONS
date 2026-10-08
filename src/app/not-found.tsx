import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="court-bg flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo size={96} />
      <h1 className="mt-6 font-display text-5xl tracking-wide">Page introuvable</h1>
      <Link href="/accueil" className="btn-primary mt-8">Retour à l&apos;accueil</Link>
    </main>
  );
}
