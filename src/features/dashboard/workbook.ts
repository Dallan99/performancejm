import Papa from "papaparse";
import type { BaseRow, DailyDataset } from "./data";

export const OFFICIAL_HEADERS = [
  "Data",
  "Base",
  "Quatidade de Veiculos",
  "Pacotes",
  "Entregas Realizadas",
  "DC Cancelado",
  "Sinistro",
  "Insucessos Normais",
  "PNR",
  "Performance Entregas Logistics",
  "Performance S/ DC Meli",
  "Performance S/ DC E Sinistros",
] as const;

const fields = [
  "date",
  "base",
  "vehicles",
  "packages",
  "deliveries",
  "dc",
  "claims",
  "failures",
  "pnr",
  "logistics",
  "withoutDc",
  "withoutClaims",
] as const;

const normalize = (value: unknown) =>
  String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

const aliases: Record<(typeof fields)[number], string[]> = {
  date: ["data"],
  base: ["base"],
  vehicles: ["quatidadedeveiculos", "quantidadedeveiculos"],
  packages: ["pacotes"],
  deliveries: ["entregasrealizadas"],
  dc: ["dccancelado"],
  claims: ["sinistro", "sinistros"],
  failures: ["insucessosnormais", "insucessos", "falhas"],
  pnr: ["pnr"],
  logistics: ["performanceentregaslogistics", "performancedeliverylogistics"],
  withoutDc: ["performancesdcmeli", "performancesdc"],
  withoutClaims: ["performancesdcesinistros", "performancesdcsinistros"],
};

export type OperationalPreview = {
  filename: string;
  date: string | null;
  headers: string[];
  rows: string[][];
  records: BaseRow[];
  consolidated: BaseRow | null;
  errors: string[];
};

function excelDate(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return value.getFullYear() + "-" + month + "-" + day;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString().slice(0, 10);
  }
  const text = String(value ?? "").trim();
  const br = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (br) return br[3] + "-" + br[2].padStart(2, "0") + "-" + br[1].padStart(2, "0");
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? iso[1] + "-" + iso[2] + "-" + iso[3] : null;
}

function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.startsWith("#") || text.toLowerCase() === "nan") return null;
  const parsed = Number(text.replace(/%$/, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function performance(value: unknown): number | null {
  const parsed = numeric(value);
  if (parsed == null) return null;
  return parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed;
}

function displayCell(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    return day + "/" + month + "/" + value.getFullYear();
  }
  return String(value);
}

export function parseOperationalMatrix(
  sheetName: string,
  matrix: unknown[][],
  filename: string,
): OperationalPreview {
  const errors: string[] = [];
  if (normalize(sheetName) !== "performance") {
    return {
      filename,
      date: null,
      headers: [],
      rows: [],
      records: [],
      consolidated: null,
      errors: ["A aba obrigatória PERFORMANCE não foi encontrada."],
    };
  }

  const headers = (matrix[1] ?? []).map((value) => String(value ?? "").trim());
  const visibleHeaders = headers.filter(Boolean);
  const indexes = fields.map((field) =>
    headers.findIndex((header) => aliases[field].includes(normalize(header))),
  );
  fields.forEach((_field, index) => {
    if (indexes[index] < 0) errors.push("Coluna ausente: " + OFFICIAL_HEADERS[index] + ".");
  });
  const headerCount = headers.filter(Boolean).length;
  if (headerCount !== 12) {
    errors.push("Esperadas exatamente 12 colunas oficiais; encontradas " + headerCount + ".");
  }
  if (indexes.some((index, position) => index !== position)) {
    errors.push("As colunas devem estar na ordem original da planilha.");
  }

  const records: BaseRow[] = [];
  const rows: string[][] = [];
  let consolidated: BaseRow | null = null;
  let date: string | null = null;
  const seen = new Set<string>();

  for (const [rowIndex, rawRow] of matrix.slice(2).entries()) {
    if (!rawRow?.some((cell) => cell != null && String(cell).trim() !== "")) continue;
    const at = (field: (typeof fields)[number]) => {
      const index = indexes[fields.indexOf(field)];
      return index < 0 ? null : rawRow[index];
    };
    const rowDate = excelDate(at("date"));
    const base = String(at("base") ?? "").trim();
    if (rowDate && date && rowDate !== date) {
      errors.push("Linha " + (rowIndex + 3) + ": há mais de uma data operacional.");
    } else if (rowDate) {
      date = rowDate;
    }

    const row: BaseRow = {
      date: rowDate ?? undefined,
      base,
      type: /\bXPT\b/i.test(base) ? "XPT" : "Services",
      vehicles: numeric(at("vehicles")) ?? 0,
      packages: numeric(at("packages")) ?? 0,
      deliveries: numeric(at("deliveries")) ?? 0,
      dc: numeric(at("dc")) ?? 0,
      claims: numeric(at("claims")) ?? 0,
      failures: numeric(at("failures")) ?? 0,
      pnr: numeric(at("pnr")) ?? 0,
      logistics: performance(at("logistics")),
      withoutDc: performance(at("withoutDc")),
      withoutClaims: performance(at("withoutClaims")),
    };

    if (normalize(base) === "consolidado") {
      if (consolidated) errors.push("Linha " + (rowIndex + 3) + ": há mais de uma linha Consolidado.");
      consolidated = row;
    } else if (!base) {
      errors.push("Linha " + (rowIndex + 3) + ": base obrigatória.");
    } else if (seen.has(normalize(base))) {
      errors.push("Linha " + (rowIndex + 3) + ": base duplicada (" + base + ").");
    } else {
      seen.add(normalize(base));
      records.push(row);
    }
    rows.push(indexes.map((index) => displayCell(index < 0 ? null : rawRow[index])));
  }

  if (!records.length) errors.push("O arquivo não possui bases operacionais.");
  if (!date) errors.push("Não foi possível identificar a data operacional.");
  if (!consolidated) errors.push("A linha Consolidado não foi encontrada.");
  return { filename, date, headers: visibleHeaders, rows, records, consolidated, errors };
}

export async function parseOperationalFile(file: File): Promise<OperationalPreview> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx") {
    const { read, utils } = await import("xlsx");
    const workbook = read(await file.arrayBuffer(), { type: "array", raw: true, cellDates: true });
    const sheetName = workbook.SheetNames.find((name) => normalize(name) === "performance");
    if (!sheetName) return parseOperationalMatrix("", [], file.name);
    const sheet = workbook.Sheets[sheetName];
    const matrix = utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
    });
    const range = utils.decode_range(sheet["!ref"] ?? "A1:A1");
    matrix.forEach((row, rowIndex) =>
      row.forEach((_value, columnIndex) => {
        const cell = sheet[
          utils.encode_cell({ r: range.s.r + rowIndex, c: range.s.c + columnIndex })
        ];
        if (cell?.t === "e") row[columnIndex] = cell.w ?? "#DIV/0!";
      }),
    );
    return parseOperationalMatrix(sheetName, matrix, file.name);
  }

  if (extension === "csv") {
    const parsed = Papa.parse<string[]>((await file.text()).replace(/^\uFEFF/, ""), {
      skipEmptyLines: false,
    });
    const preview = parseOperationalMatrix("PERFORMANCE", [[], ...parsed.data], file.name);
    preview.errors.unshift(
      ...parsed.errors.map((error) => "Linha " + ((error.row ?? 0) + 1) + ": " + error.message),
    );
    return preview;
  }
  throw new Error("Selecione um arquivo .xlsx ou .csv.");
}

export function previewToDataset(preview: OperationalPreview): DailyDataset | null {
  if (preview.errors.length || !preview.date || !preview.consolidated) return null;
  return {
    date: preview.date,
    rows: preview.records,
    consolidated: preview.consolidated,
    filename: preview.filename,
    sourceHeaders: preview.headers,
    sourceRows: preview.rows,
  };
}

