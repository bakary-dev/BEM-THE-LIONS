import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HelpFab } from "@/components/HelpFab";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { season } = await getSettings();
  return (
    <div className="court-bg flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1 pb-16">{children}</div>
      <SiteFooter season={season} />
      <HelpFab />
    </div>
  );
}
