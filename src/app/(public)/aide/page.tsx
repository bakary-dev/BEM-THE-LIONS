import { HelpContacts } from "@/components/HelpContacts";
import { getSettings, toPublicSettings } from "@/lib/settings";

export const metadata = { title: "Besoin d'aide ?" };

export default async function HelpPage() {
  const settings = toPublicSettings(await getSettings());
  return (
    <main className="container-page py-10 sm:py-14">
      <HelpContacts settings={settings} />
    </main>
  );
}
