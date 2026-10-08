"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { BRAND } from "@/config/brand";
import { Logo } from "./Logo";

export type CardData = {
  candidateNumber: string;
  firstName: string;
  lastName: string;
  qrCode: string;
  season: string;
};

const QR_OPTIONS = { errorCorrectionLevel: "H" as const, margin: 2, width: 640, color: { dark: "#0A0A0C", light: "#FFFFFF" } };

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Compose la carte candidat complète (logo, identité, numéro, QR, saison) en PNG. */
async function renderCardPng(data: CardData, qrDataUrl: string): Promise<string> {
  const W = 1080;
  const H = 1500;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1A1A20");
  bg.addColorStop(1, "#0A0A0C");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#F5B700";
  ctx.fillRect(0, 0, W, 14);
  ctx.fillRect(0, H - 14, W, 14);

  const logo = await loadImage(BRAND.logoSrc);
  if (logo) ctx.drawImage(logo, W / 2 - 90, 60, 180, 180);

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 76px Impact, 'Bebas Neue', sans-serif";
  ctx.fillText(BRAND.name, W / 2, logo ? 320 : 200);
  ctx.fillStyle = "#F5B700";
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.fillText(`CARTE CANDIDAT · RECRUTEMENT ${data.season}`, W / 2, logo ? 375 : 255);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 58px system-ui, sans-serif";
  ctx.fillText(data.lastName.toUpperCase(), W / 2, 480);
  ctx.font = "48px system-ui, sans-serif";
  ctx.fillText(data.firstName, W / 2, 545);

  const qr = await loadImage(qrDataUrl);
  const size = 600;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(W / 2 - size / 2 - 20, 600, size + 40, size + 40, 32);
  ctx.fill();
  if (qr) ctx.drawImage(qr, W / 2 - size / 2, 620, size, size);

  ctx.fillStyle = "#F5B700";
  ctx.font = "bold 72px ui-monospace, monospace";
  ctx.fillText(data.candidateNumber, W / 2, 1340);
  ctx.fillStyle = "#D4D4D8";
  ctx.font = "34px system-ui, sans-serif";
  ctx.fillText("Présentez ce QR Code le jour de la sélection.", W / 2, 1420);

  return canvas.toDataURL("image/png");
}

export function CandidateCard({ data }: { data: CardData }) {
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(data.qrCode, QR_OPTIONS).then(setQr).catch(() => setQr(null));
  }, [data.qrCode]);

  async function downloadCard() {
    if (!qr) return;
    setBusy(true);
    try {
      triggerDownload(await renderCardPng(data, qr), `${data.candidateNumber}-carte-candidat.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm animate-pop-in">
      <article
        className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-ink-700 to-ink p-6 text-center shadow-2xl shadow-gold/10"
        aria-label={`Carte candidat ${data.candidateNumber}`}
        data-testid="candidate-card"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-gold via-ball to-gold" />
        <div className="flex items-center justify-center gap-3">
          <Logo size={56} />
          <div className="text-left">
            <p className="font-display text-2xl leading-none tracking-wide">{BRAND.name}</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Saison {data.season}</p>
          </div>
        </div>
        <p className="mt-5 text-xl font-extrabold uppercase">{data.lastName}</p>
        <p className="text-lg text-mist-300">{data.firstName}</p>
        <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3">
          {qr ? (
            <img src={qr} alt={`QR Code du candidat ${data.candidateNumber}`} className="h-56 w-56" data-testid="qr-image" />
          ) : (
            <div className="h-56 w-56 animate-pulse rounded-lg bg-mist-300" />
          )}
        </div>
        <p className="mt-4 font-mono text-2xl font-bold tracking-wider text-gold" data-testid="card-number">
          {data.candidateNumber}
        </p>
        <p className="mt-2 text-sm text-mist-300">Présentez ce QR Code le jour de la sélection.</p>
      </article>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="btn-primary"
          disabled={!qr}
          onClick={() => qr && triggerDownload(qr, `${data.candidateNumber}-qr-code.png`)}
        >
          ⬇️ QR Code
        </button>
        <button type="button" className="btn-secondary" disabled={!qr || busy} onClick={downloadCard}>
          {busy ? "Préparation…" : "⬇️ Carte complète"}
        </button>
      </div>
    </div>
  );
}
