import type { AuditEntry } from "@/lib/auditTrail";

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Escape quotes by doubling them; wrap if contains comma/quote/newline
  const escaped = str.replace(/"/g, '""');
  if (/[\n\r,"]/g.test(str)) return `"${escaped}"`;
  return escaped;
}

export function auditEntriesToCsv(entries: AuditEntry[]): string {
  const headers = [
    "timestamp",
    "action",
    "collection",
    "recordId",
    "recordName",
    "userId",
    "userName",
    "changes",
  ];

  const lines = entries.map((e) => {
    const changesSummary = (e.changes || [])
      .map((c) => `${c.field}: ${String(c.oldValue ?? "")} -> ${String(c.newValue ?? "")}`)
      .join(" | ");

    const row = [
      e.timestamp,
      e.action,
      e.collection,
      e.recordId,
      e.recordName ?? "",
      e.userId ?? "",
      e.userName ?? "",
      changesSummary,
    ];

    return row.map(escapeCsvCell).join(",");
  });

  return [headers.join(","), ...lines].join("\n");
}

export function downloadStringAsFile(opts: {
  content: string;
  filename: string;
  mimeType: string;
}) {
  const blob = new Blob([opts.content], { type: opts.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportAuditEntriesAsJson(entries: AuditEntry[], filename: string) {
  downloadStringAsFile({
    content: JSON.stringify(entries, null, 2),
    filename,
    mimeType: "application/json;charset=utf-8",
  });
}

export function exportAuditEntriesAsCsv(entries: AuditEntry[], filename: string) {
  downloadStringAsFile({
    content: auditEntriesToCsv(entries),
    filename,
    mimeType: "text/csv;charset=utf-8",
  });
}
