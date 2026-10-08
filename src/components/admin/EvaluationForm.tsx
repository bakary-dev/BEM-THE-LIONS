"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EVALUATION_CRITERIA, SCORE_MAX, SCORE_MIN, type Scores } from "@/modules/recruitment/evaluation";

export function EvaluationForm({ candidateId, initialScores, initialNotes }: { candidateId: string; initialScores: Scores | null; initialNotes: string }) {
  const router = useRouter();
  const [scores, setScores] = useState<Scores>(
    () => initialScores ?? (Object.fromEntries(EVALUATION_CRITERIA.map((c) => [c.key, 5])) as Scores),
  );
  const [notes, setNotes] = useState(initialNotes);
  const [state, setState] = useState<{ kind: "idle" | "saving" | "saved" | "error"; message?: string }>({ kind: "idle" });
  const average = useMemo(() => {
    const v = Object.values(scores);
    return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
  }, [scores]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "saving" });
    const res = await fetch(`/api/admin/candidates/${candidateId}/evaluation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores, notes }),
    }).catch(() => null);
    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}));
      setState({ kind: "error", message: body?.error ?? "Enregistrement impossible." });
      return;
    }
    setState({ kind: "saved" });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5" data-testid="evaluation-form">
      <div className="grid gap-4 sm:grid-cols-2">
        {EVALUATION_CRITERIA.map((c) => (
          <div key={c.key} className="rounded-xl bg-white/[.03] p-3">
            <div className="flex items-center justify-between">
              <label htmlFor={`score-${c.key}`} className="font-semibold">{c.label}</label>
              <output htmlFor={`score-${c.key}`} className="font-display text-2xl text-gold">{scores[c.key]}<span className="text-sm text-mist-500">/{SCORE_MAX}</span></output>
            </div>
            <input
              id={`score-${c.key}`}
              name={c.key}
              type="range"
              min={SCORE_MIN}
              max={SCORE_MAX}
              step={1}
              value={scores[c.key]}
              onChange={(e) => {
                setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }));
                setState({ kind: "idle" });
              }}
              className="mt-2 h-8 w-full accent-[#F5B700]"
            />
          </div>
        ))}
      </div>
      <p className="text-sm text-mist-300">Moyenne : <strong className="text-gold">{average}/{SCORE_MAX}</strong></p>
      <div>
        <label htmlFor="notes" className="label">OBSERVATIONS DU RESPONSABLE</label>
        <textarea id="notes" name="notes" rows={4} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="Points forts, axes de progression…" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary" disabled={state.kind === "saving"}>
          {state.kind === "saving" ? "Enregistrement…" : "Enregistrer l'évaluation"}
        </button>
        {state.kind === "saved" && <span className="text-sm font-semibold text-green-300" role="status">✅ Évaluation enregistrée</span>}
        {state.kind === "error" && <span className="text-sm font-semibold text-red-300" role="alert">{state.message}</span>}
      </div>
    </form>
  );
}
