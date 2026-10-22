import { describe, it, expect, vi } from "vitest";
import {
  performanceTone,
  aggregate,
  rowsForDate,
  LATEST_DATE,
  columns,
  dates,
  findImportConflict,
  getImportedDataset,
  latestAvailableDate,
  registerImportedDataset,
  removeImportedDataset,
} from "./data";
import { parseDailyCsv } from "./csv";
describe("Official performance thresholds", () => {
  it.each([
    [98.2, "success"],
    [98.19999, "warning"],
    [96.5, "warning"],
    [96.49999, "danger"],
    [0, "danger"],
    [null, "neutral"],
    [NaN, "neutral"],
  ] as const)("classifies %s using raw value", (value, tone) =>
    expect(performanceTone(value)).toBe(tone),
  );
  it("marks no operation as neutral", () => expect(performanceTone(99, false)).toBe("neutral"));
  it("aggregates volume rather than averaging base percentages", () => {
    const r = rowsForDate(LATEST_DATE);
    const a = aggregate(r);
    expect(a.logistics).toBe((a.deliveries / a.packages) * 100);
    expect(r).toHaveLength(16);
  });
});
describe("Daily CSV preview", () => {
  const rows = rowsForDate(LATEST_DATE);
  const csv = [
    columns.map((c) => c.label).join(";"),
    ...rows.map((r) => columns.map((c) => r[c.key]).join(";")),
  ].join("\n");
  const first = rows[0];
  if (!first) throw new Error("Demo rows required");
  it("accepts all 12 original columns", () => expect(parseDailyCsv(csv).errors).toEqual([]));
  it("rejects missing columns", () =>
    expect(parseDailyCsv("Base/Código;Pacotes\nSSP3;200").errors.length).toBeGreaterThan(0));
  it("rejects duplicates", () =>
    expect(
      parseDailyCsv(csv + "\n" + columns.map((c) => first[c.key]).join(";")).errors.some((e) =>
        e.includes("duplicada"),
      ),
    ).toBe(true));
  it("supports quoted decimal commas", () =>
    expect(
      parseDailyCsv(
        csv.replace(String(first.logistics), `"${String(first.logistics).replace(".", ",")}"`),
      ).errors,
    ).toEqual([]));
});

describe("Imported dataset removal", () => {
  it("removes only the selected import and notifies subscribers", () => {
    const date = "2025-10-13";
    const filename = "Dash 13.10.xlsx";
    const rows = rowsForDate(LATEST_DATE).slice(0, 1);
    registerImportedDataset({ date, filename, rows, consolidated: aggregate(rows) });
    const listener = vi.fn();
    window.addEventListener("dashboard:dataset-removed", listener);

    const removed = removeImportedDataset(date);

    expect(removed?.filename).toBe(filename);
    expect(getImportedDataset(date)).toBeNull();
    expect(findImportConflict(date, filename)).toBeNull();
    expect(latestAvailableDate()).toBe(LATEST_DATE);
    expect(dates).not.toContain(date);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { date, latestDate: LATEST_DATE } }),
    );
    expect(removeImportedDataset(date)).toBeNull();
    window.removeEventListener("dashboard:dataset-removed", listener);
  });
});

