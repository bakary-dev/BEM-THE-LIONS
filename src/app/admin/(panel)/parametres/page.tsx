import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdminPage } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  await requireAdminPage("ADMIN");
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide sm:text-5xl">PARAMÈTRES</h1>
        <p className="text-sm text-mist-400">Ces valeurs alimentent l&apos;accueil, la page « Besoin d&apos;aide ? » et la page des candidats retenus.</p>
      </div>
      <SettingsForm
        initial={{
          teamName: s.teamName,
          city: s.city,
          season: s.season,
          teamMembersCount: s.teamMembersCount,
          winsCount: s.winsCount,
          lossesCount: s.lossesCount,
          previousSeason: s.previousSeason,
          whatsappGroupLink: s.whatsappGroupLink,
          responsibleName: s.responsibleName,
          responsibleWhatsapp: s.responsibleWhatsapp,
          responsiblePhone: s.responsiblePhone,
          coachName: s.coachName,
          coachWhatsapp: s.coachWhatsapp,
          coachPhone: s.coachPhone,
        }}
      />
    </div>
  );
}
