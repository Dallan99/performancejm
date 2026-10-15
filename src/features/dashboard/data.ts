export const TARGET = 98.2;
export const WARNING = 96.5;
export type Tone = "success" | "warning" | "danger" | "neutral";
export function performanceTone(value: number | null | undefined, operating = true): Tone {
  if (!operating || value == null || !Number.isFinite(value)) return "neutral";
  return value >= TARGET ? "success" : value >= WARNING ? "warning" : "danger";
}
export const toneLabels = {
  success: "Dentro da meta",
  warning: "Atenção",
  danger: "Crítico",
  neutral: "Sem dados",
};
export const number = (n: number) => n.toLocaleString("pt-BR");
export const percent = (n: number | null) =>
  n == null
    ? "—"
    : `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
export type BaseRow = {
  base: string;
  type: string;
  vehicles: number;
  packages: number;
  deliveries: number;
  dc: number;
  claims: number;
  failures: number;
  pnr: number;
  logistics: number | null;
  withoutDc: number | null;
  withoutClaims: number | null;
};
export const columns: { key: keyof BaseRow; label: string }[] = [
  { key: "base", label: "Base/Código" },
  { key: "type", label: "Tipo de Operação" },
  { key: "vehicles", label: "Veículos" },
  { key: "packages", label: "Pacotes" },
  { key: "deliveries", label: "Entregas" },
  { key: "dc", label: "DC Cancelado" },
  { key: "claims", label: "Sinistros" },
  { key: "failures", label: "Insucessos" },
  { key: "pnr", label: "PNR" },
  { key: "logistics", label: "Performance Logistics" },
  { key: "withoutDc", label: "Performance S/DC" },
  { key: "withoutClaims", label: "Performance S/DC+Sinistro" },
];
const seeds: [string, string, number, number, number][] = [
  ["SSP3 Campinas", "Services", 82, 10248, 99.12],
  ["SSP38 Itupeva", "Services", 46, 5710, 98.87],
  ["ESP15 XPT Ibiúna", "XPT", 24, 2940, 98.62],
  ["SSP5 Barueri", "Services", 96, 12560, 99.34],
  ["SSP20 Sorocaba", "Services", 58, 7210, 97.85],
  ["SSP56 XPT Embu Guaçu", "XPT", 18, 2150, 96.92],
  ["ESP16 XPT Guarujá", "XPT", 21, 2460, 95.78],
  ["SSP17 ABC", "Services", 74, 9680, 98.45],
  ["SSP6 Mauá", "Services", 38, 4860, 97.62],
  ["SSP45 Itaquera", "Services", 65, 8470, 98.72],
  ["SSP15 Santos", "Services", 32, 3840, 96.34],
  ["SSP37 Campinas", "Services", 53, 6610, 99.08],
  ["SSP23 Suzano", "Services", 41, 5080, 97.94],
  ["SSC2 Biguaçu", "Services", 27, 3150, 99.26],
  ["SSP25 Atibaia", "Services", 29, 3460, 98.53],
  ["ESP18 Franco da Rocha", "XPT", 23, 2820, 96.81],
];
export const dates = Array.from(
  { length: 14 },
  (_, i) => `2026-10-${String(14 - i).padStart(2, "0")}`,
);
export const LATEST_DATE = dates[0] ?? "2026-10-14";
export function rowsForDate(date: string = LATEST_DATE): BaseRow[] {
  const offset = Math.max(0, dates.indexOf(date));
  return seeds.map(([base, type, vehicles, packages, performance], i) => {
    const p = Math.max(
      91,
      Math.min(99.8, performance - offset * 0.045 + (offset ? Math.sin(i + offset) * 0.28 : 0)),
    );
    const total = Math.round(packages * (1 - offset * 0.009));
    const deliveries = Math.round((total * p) / 100);
    const missed = total - deliveries;
    const dc = Math.round(missed * 0.4),
      claims = Math.round(missed * 0.05),
      pnr = Math.round(missed * 0.12);
    return {
      base,
      type,
      vehicles,
      packages: total,
      deliveries,
      dc,
      claims,
      pnr,
      failures: missed - dc - claims - pnr,
      logistics: (deliveries / total) * 100,
      withoutDc: (deliveries / (total - dc)) * 100,
      withoutClaims: (deliveries / (total - dc - claims)) * 100,
    };
  });
}
export const metricNames = {
  logistics: "Performance Logistics",
  withoutDc: "Performance S/DC",
  withoutClaims: "Performance S/DC+Sinistro",
};
export type Metric = keyof typeof metricNames;
export function aggregate(rows: BaseRow[]) {
  const totals = rows.reduce(
    (a, r) => ({
      vehicles: a.vehicles + r.vehicles,
      packages: a.packages + r.packages,
      deliveries: a.deliveries + r.deliveries,
      dc: a.dc + r.dc,
      claims: a.claims + r.claims,
      failures: a.failures + r.failures,
      pnr: a.pnr + r.pnr,
    }),
    { vehicles: 0, packages: 0, deliveries: 0, dc: 0, claims: 0, failures: 0, pnr: 0 },
  );
  return {
    ...totals,
    logistics: totals.packages ? (totals.deliveries / totals.packages) * 100 : null,
    withoutDc:
      totals.packages - totals.dc
        ? (totals.deliveries / (totals.packages - totals.dc)) * 100
        : null,
    withoutClaims:
      totals.packages - totals.dc - totals.claims
        ? (totals.deliveries / (totals.packages - totals.dc - totals.claims)) * 100
        : null,
  };
}
export function shortDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}
export function exportCsv(rows: BaseRow[]) {
  const csv =
    "\uFEFF" +
    [
      columns.map((c) => c.label).join(";"),
      ...rows.map((r) =>
        columns.map((c) => `"${String(r[c.key] ?? "").replaceAll('"', '""')}"`).join(";"),
      ),
    ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "jm-dashboard-ds.csv";
  a.click();
  URL.revokeObjectURL(url);
}
