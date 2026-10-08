import { Splash } from "@/components/Splash";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SplashPage() {
  const { season } = await getSettings();
  return <Splash season={season} />;
}
