import { StatusLookup } from "@/components/StatusLookup";
import { getSettings, toPublicSettings } from "@/lib/settings";

export const metadata = { title: "Mon résultat" };

export default async function StatusPage() {
  const settings = toPublicSettings(await getSettings());
  return (
    <main className="container-page py-10 sm:py-14">
      <StatusLookup settings={settings} />
    </main>
  );
}
