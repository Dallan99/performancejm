import { describe, expect, it } from "vitest";
import { performanceTone } from "./data";
import { OFFICIAL_HEADERS, parseOperationalMatrix } from "./workbook";

const bases = [
  "Campinas_SSP3",
  "Itupeva_SSP38",
  "XPT Ibiúna_ESP15",
  "Mega Barueri_SSP5",
  "Sorocaba_SSP20",
  "XPT São Lourenço_ESP17",
  "XPT Guarujá_ESP16",
  "ABC_SSP17",
  "XPT Franco da Rocha_ESP18",
  "Mauá_SSP6",
  "Itaquera_SSP45",
  "Santos_SSP15",
  "Campinas_SSP37",
  "Suzano_SSP23",
  "Biguaçu_SSC2",
  "Cravinhos_SSP4",
  "Lapa_SSP7",
];

const matrix = [
  [null, null, "DATA:", "13/10/2026"],
  [...OFFICIAL_HEADERS],
  ["13.09.2025", bases[0], 9, 1215, 1130, 0, 0, 85, 0, 0.9300411522633745, 0.9300411522633745, 0.9300411522633745],
  ["13.09.2025", bases[1], 18, 1146, 1108, 0, 0, 38, 2, 0.9668411867364747, 0.9668411867364747, 0.9668411867364747],
  ["13.09.2025", bases[2], 33, 2898, 2779, 0, 0, 119, 1, 0.9589371980676329, 0.9589371980676329, 0.9589371980676329],
  ["13.09.2025", bases[3], 22, 1631, 1583, 0, 0, 48, 2, 0.970570202329859, 0.970570202329859, 0.970570202329859],
  ["13.09.2025", bases[4], 2, 214, 202, 0, 0, 12, 1, 0.9439252336448598, 0.9439252336448598, 0.9439252336448598],
  ["13.09.2025", bases[5], 18, 1606, 1565, 0, 0, 41, 1, 0.9744707347447074, 0.9744707347447074, 0.9744707347447074],
  ["13.09.2025", bases[6], 36, 3285, 3166, 0, 0, 119, 1, 0.9637747336377473, 0.9637747336377473, 0.9637747336377473],
  ["13.09.2025", bases[7], 13, 1340, 1260, 0, 1, 79, 2, 0.9402985074626866, 0.9402985074626866, 0.941044776119403],
  ["13.09.2025", bases[8], 38, 3133, 3082, 0, 0, 51, 3, 0.983721672518353, 0.983721672518353, 0.983721672518353],
  ["13.09.2025", bases[9], 9, 1140, 1107, 0, 0, 33, 2, 0.9710526315789474, 0.9710526315789474, 0.9710526315789474],
  ["13.09.2025", bases[10], 36, 3250, 3179, 0, 0, 71, 3, 0.9781538461538462, 0.9781538461538462, 0.9781538461538462],
  ["13.09.2025", bases[11], 13, 1042, 1007, 0, 0, 35, 0, 0.9664107485604606, 0.9664107485604606, 0.9664107485604606],
  ["13.09.2025", bases[12], 9, 1538, 1480, 0, 0, 58, 2, 0.9622886866059818, 0.9622886866059818, 0.9622886866059818],
  ["13.09.2025", bases[13], 46, 3750, 3659, 0, 0, 91, 1, 0.9757333333333333, 0.9757333333333333, 0.9757333333333333],
  ["13.09.2025", bases[14], 25, 1911, 1829, 0, 0, 82, 0, 0.9570905285190999, 0.9570905285190999, 0.9570905285190999],
  ["13.09.2025", bases[15], 5, 635, 617, 0, 0, 18, 1, 0.9716535433070866, 0.9716535433070866, 0.9716535433070866],
  ["13.09.2025", bases[16], 0, 0, 0, 0, 0, 0, 0, "#DIV/0!", "#DIV/0!", "#DIV/0!"],
  [],
  [" ", "Consolidado", 332, 29734, 28753, 0, 1, 980, 22, null, null, 0.9670410977332347],
];

describe("Operational workbook fidelity", () => {
  it.each(["Dash 13.10.xlsx", "Dash 14.10.xlsx"])("reads the supplied layout in %s", (filename) => {
    const result = parseOperationalMatrix("PERFORMANCE", matrix, filename);
    expect(result.errors).toEqual([]);
    expect(result.headers).toEqual(OFFICIAL_HEADERS);
    expect(result.date).toBe("2025-09-13");
    expect(result.records.map((row) => row.base)).toEqual(bases);
    expect(result.records).toHaveLength(17);
  });

  it("converts decimal fractions to percentages and keeps errors neutral", () => {
    const result = parseOperationalMatrix("PERFORMANCE", matrix, "Dash 13.10.xlsx");
    const first = result.records[0];
    const lapa = result.records.at(-1);
    if (!first || !lapa) throw new Error("Workbook fixture is incomplete");
    expect(first.logistics).toBeCloseTo(93.00411522633745);
    expect(performanceTone(first.logistics)).toBe("danger");
    expect(lapa.logistics).toBeNull();
    expect(performanceTone(lapa.logistics, lapa.packages > 0)).toBe("neutral");
  });

  it("keeps the official Consolidado separate without recalculating its values", () => {
    const result = parseOperationalMatrix("PERFORMANCE", matrix, "Dash 14.10.xlsx");
    expect(result.records.some((row) => row.base === "Consolidado")).toBe(false);
    expect(result.consolidated?.vehicles).toBe(332);
    expect(result.consolidated?.packages).toBe(29734);
    expect(result.consolidated?.deliveries).toBe(28753);
    expect(result.consolidated?.logistics).toBeNull();
    expect(result.consolidated?.withoutClaims).toBeCloseTo(96.70410977332347);
  });

  it("rejects columns that do not follow the source order", () => {
    const shuffled = [...matrix];
    shuffled[1] = [OFFICIAL_HEADERS[1], OFFICIAL_HEADERS[0], ...OFFICIAL_HEADERS.slice(2)];
    expect(parseOperationalMatrix("PERFORMANCE", shuffled, "invalid.xlsx").errors).toContain(
      "As colunas devem estar na ordem original da planilha.",
    );
  });
});

