"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS, type CandidateStatus } from "@/modules/recruitment/constants";

export function DecisionPanel({ candidateId, candidateName, current, canDecide }: { candidateId: string; candidateName: string; current: CandidateStatus | null; canDecide: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<CandidateStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!pending) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/candidates/${candidateId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: pending, confirm: true }),
    }).catch(() => null);
    setLoading(false);
    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}));
      setError(body?.error ?? "Décision impossible.");
      return;
    }
    setPending(null);
    router.refresh();
  }

  if (!canDecide) {
    return <p className="text-sm text-mist-400">Seul un administrateur peut prendre la décision finale.</p>;
  }

  return (
    <div data-testid="decision-panel">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" className={`btn-success text-base ${current === "RETENU" ? "ring-2 ring-white" : ""}`} onClick={() => setPending("RETENU")}>
          🟢 RETENU
        </button>
        <button type="button" className={`btn-danger text-base ${current === "NON_RETENU" ? "ring-2 ring-white" : ""}`} onClick={() => setPending("NON_RETENU")}>
          🔴 NON RETENU
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}

      {pending && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="card w-full max-w-md animate-slide-up p-6">
            <h3 id="confirm-title" className="font-display text-3xl tracking-wide">Confirmer la décision</h3>
            <p className="mt-3 text-mist-300">
              Marquer <strong className="text-white">{candidateName}</strong> comme{" "}
              <strong className={pending === "RETENU" ? "text-green-300" : "text-red-300"}>{STATUS_LABELS[pending]}</strong> ?
            </p>
            <p className="mt-2 text-sm text-mist-400">Le candidat verra ce résultat en saisissant son numéro candidat.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" className="btn-secondary" onClick={() => setPending(null)} disabled={loading}>Annuler</button>
              <button type="button" className={pending === "RETENU" ? "btn-success" : "btn-danger"} onClick={confirm} disabled={loading} data-testid="confirm-decision">
                {loading ? "…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
