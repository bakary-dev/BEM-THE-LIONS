"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/config/brand";

type Props = { size?: number; className?: string; priority?: boolean };

/**
 * Logo officiel BEM THE LIONS (fichier fourni dans public/brand/).
 * Si le fichier est absent, affiche le nom officiel en attendant (aucun logo de substitution n'est créé).
 */
export function Logo({ size = 48, className = "", priority = false }: Props) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // L'erreur de chargement peut survenir avant l'hydratation : on vérifie l'état de l'image au montage.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (failed) {
    return (
      <span
        role="img"
        aria-label={BRAND.name}
        style={{ width: size, height: size, fontSize: Math.max(9, size * 0.2) }}
        className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-gold bg-ink-800 text-center font-display leading-[0.95] text-gold ${className}`}
      >
        BEM
        <br />
        THE LIONS
      </span>
    );
  }
  return (
    <img
      ref={imgRef}
      src={BRAND.logoSrc}
      alt={`Logo ${BRAND.name}`}
      width={size}
      height={size}
      fetchPriority={priority ? "high" : undefined}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
