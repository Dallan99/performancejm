import { describe, expect, it } from "vitest";
import { baseCode, isBaseForSupervisor, supervisorGroups } from "./data";

describe("supervisor base groups", () => {
  it("normalizes base codes across accents, separators, and leading zeros", () => {
    expect(baseCode("Mauá SSP06")).toBe("SSP6");
    expect(baseCode("Campinas SSP37 /03")).toBe("SSP37");
    expect(baseCode("XPT São Lourenço_ESP17")).toBe("ESP17");
  });

  it("assigns all listed bases to Patricia, Sergio, and Juliana", () => {
    for (const group of supervisorGroups) {
      expect(group.baseCodes).toHaveLength(4);
      for (const code of group.baseCodes) {
        expect(isBaseForSupervisor(`Base ${code}`, group.name)).toBe(true);
      }
    }
  });

  it("matches workbook names by route code without renaming the source base", () => {
    expect(isBaseForSupervisor("ABC_SSP17", "Patricia")).toBe(true);
    expect(isBaseForSupervisor("Santos_SSP15", "Sergio")).toBe(true);
    expect(isBaseForSupervisor("XPT Guarujá_ESP16", "Sergio")).toBe(true);
    expect(isBaseForSupervisor("Campinas_SSP37", "Juliana")).toBe(true);
    expect(isBaseForSupervisor("Campinas_SSP3", "Juliana")).toBe(false);
  });
});

