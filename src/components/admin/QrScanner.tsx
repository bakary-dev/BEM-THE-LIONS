"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Html5Qrcode } from "html5-qrcode";
import { genderLabel, isStatus, STATUS_LABELS } from "@/modules/recruitment/constants";

type ScannedCandidate = {
  id: string;
  candidateNumber: string;
  lastName: string;
  firstName: string;
  gender: string;
  studyYear: string;
  fieldOfStudy: string;
  phone: string;
  email: string;
  status: string | null;
  scanCount: number;
  evaluated: boolean;
};
type Result = { found: true; candidate: ScannedCandidate } | { found: false; code: string };

const READER_ID = "qr-reader";

export function QrScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);

  const stop = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (s) {
      try {
        if (s.isScanning) await s.stop();
        s.clear();
      } catch {
        /* déjà arrêté */
      }
    }
  }, []);

  const verify = useCallback(async (code: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await res.json().catch(() => ({ found: false }));
      setResult(body.found ? { found: true, candidate: body.candidate } : { found: false, code });
      if (navigator.vibrate) navigator.vibrate(body.found ? 120 : [80, 60, 80]);
    } catch {
      setResult({ found: false, code });
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }, []);

  async function start() {
    setCameraError(null);
    setResult(null);
    if (!window.isSecureContext) {
      setCameraError("La caméra nécessite une connexion sécurisée (HTTPS). Utilisez la saisie manuelle ci-dessous.");
      return;
    }
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(READER_ID, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: (w, h) => {
            const size = Math.floor(Math.min(w, h) * 0.75);
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        async (decoded) => {
          await stop();
          await verify(decoded);
        },
        () => {},
      );
    } catch (err) {
      await stop();
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(
        /Permission|NotAllowed/i.test(msg)
          ? "Accès à la caméra refusé. Autorisez la caméra dans les réglages du navigateur."
          : "Impossible de démarrer la caméra sur cet appareil. Utilisez la saisie manuelle.",
      );
    }
  }

  useEffect(() => () => void stop(), [stop]);

  async function onManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manual.trim()) return;
    await stop();
    await verify(manual.trim());
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="card overflow-hidden p-4">
        <div id={READER_ID} className={`mx-auto aspect-square w-full overflow-hidden rounded-xl bg-black ${scanning ? "" : "hidden"}`} />
        {!scanning && (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-white/15 text-center">
            <span className="text-6xl" aria-hidden>📷</span>
            <button type="button" onClick={start} className="btn-primary px-8 text-base" data-testid="start-scan">
              {result ? "Scanner un autre candidat" : "Activer la caméra"}
            </button>
          </div>
        )}
        {scanning && (
          <button type="button" onClick={stop} className="btn-secondary mt-4 w-full">Arrêter la caméra</button>
        )}
        {cameraError && <p className="field-error mt-3" role="alert">{cameraError}</p>}
      </div>

      <form onSubmit={onManual} className="card flex flex-col gap-3 p-4 sm:flex-row" data-testid="manual-form">
        <label htmlFor="manual-code" className="sr-only">Numéro candidat</label>
        <input id="manual-code" value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} placeholder="Saisie manuelle : BEM-2026-XXXX" className="input font-mono" autoComplete="off" />
        <button type="submit" className="btn-secondary shrink-0" disabled={loading}>Vérifier</button>
      </form>

      {loading && <p className="text-center text-mist-400" role="status">Vérification…</p>}

      {result?.found && (
        <section className="card animate-pop-in border-success/50 p-5" data-testid="scan-verified" aria-live="polite">
          <p className="font-display text-3xl tracking-wide text-green-300">✅ CANDIDAT VÉRIFIÉ</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {(
              [
                ["Nom", result.candidate.lastName],
                ["Prénom", result.candidate.firstName],
                ["Genre", genderLabel(result.candidate.gender)],
                ["Année", result.candidate.studyYear],
                ["Filière", result.candidate.fieldOfStudy],
                ["Téléphone", result.candidate.phone],
                ["Email", result.candidate.email],
                ["Numéro candidat", result.candidate.candidateNumber],
                ["Statut", isStatus(result.candidate.status) ? STATUS_LABELS[result.candidate.status] : "Aucune décision"],
                ["Évaluation", result.candidate.evaluated ? "Déjà évalué" : "Pas encore évalué"],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className={k === "Email" ? "col-span-2" : ""}>
                <dt className="text-xs uppercase tracking-wider text-mist-500">{k}</dt>
                <dd className="break-words font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href={`/admin/candidats/${result.candidate.id}?verified=1#evaluation`} className="btn-primary" data-testid="open-evaluation">
              Ouvrir l&apos;évaluation
            </Link>
            <Link href={`/admin/candidats/${result.candidate.id}?verified=1`} className="btn-secondary">Voir le profil</Link>
          </div>
        </section>
      )}

      {result && !result.found && (
        <section className="card animate-pop-in border-danger/50 p-5 text-center" data-testid="scan-not-found" aria-live="polite">
          <p className="font-display text-3xl tracking-wide text-red-300">❌ CANDIDATURE INTROUVABLE</p>
          <p className="mt-2 text-mist-300">Cette personne n&apos;est pas enregistrée dans la base de recrutement BEM THE LIONS.</p>
          <p className="mt-2 break-all font-mono text-xs text-mist-500">Code lu : {result.code}</p>
        </section>
      )}
    </div>
  );
}
