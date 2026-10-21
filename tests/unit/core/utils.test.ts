import { describe, expect, it } from "vitest";
import { translateScanType } from "@app/core/utils/status.utils";

describe("translateScanType", () => {
  it.each([
    ["ASSIGNMENT", "Asignada"],
    ["RECURRING", "Ronda"],
    ["FREE", "Libre"],
    ["OTRO", "OTRO"],
  ])("%s → %s", (input, expected) => expect(translateScanType(input)).toBe(expected));
});
