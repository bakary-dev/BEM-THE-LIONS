import { isStatus, STATUS_LABELS } from "@/modules/recruitment/constants";

export function StatusBadge({ status }: { status: string | null }) {
  if (!isStatus(status)) {
    return <span className="inline-flex rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-mist-400" title="Aucune décision prise">—</span>;
  }
  const retenu = status === "RETENU";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${retenu ? "bg-success/15 text-green-300" : "bg-danger/15 text-red-300"}`}>
      {retenu ? "🟢" : "🔴"} {STATUS_LABELS[status]}
    </span>
  );
}
