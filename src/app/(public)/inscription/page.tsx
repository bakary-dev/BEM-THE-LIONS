import { RegistrationForm } from "@/components/RegistrationForm";
import { Logo } from "@/components/Logo";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Inscription" };

export default async function RegistrationPage() {
  const s = await getSettings();
  return (
    <main className="container-page py-10 sm:py-14">
      <header className="mb-8 flex flex-col items-center text-center">
        <Logo size={72} />
        <p className="eyebrow mt-4">Recrutement {s.season}</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide sm:text-6xl">Inscription</h1>
        <p className="mt-2 text-mist-300">Tous les champs sont obligatoires.</p>
      </header>
      <RegistrationForm teamName={s.teamName} season={s.season} />
    </main>
  );
}
