import { QrScanner } from "@/components/admin/QrScanner";

export const metadata = { title: "Scanner" };

export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="eyebrow">Jour de sélection</p>
        <h1 className="font-display text-4xl tracking-wide sm:text-5xl">SCANNER UN CANDIDAT</h1>
        <p className="mt-1 text-sm text-mist-400">Placez le QR Code du candidat dans le cadre.</p>
      </div>
      <QrScanner />
    </div>
  );
}
