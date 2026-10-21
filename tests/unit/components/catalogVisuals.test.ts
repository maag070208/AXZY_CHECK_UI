import { describe, expect, it } from "vitest";
import {
  CATALOG_META,
  CATALOG_ORDER,
  cx,
  getCategoryColor,
  getCategoryIcon,
  getCategoryTint,
  isHexColor,
  normalizeSearch,
  pluralize,
} from "@app/modules/catalogs/components/catalogVisuals";

describe("catalogVisuals", () => {
  describe("isHexColor", () => {
    it.each([
      ["#A1B2C3", true],
      ["#a1b2c3", true],
      ["#000000", true],
      ["#FFF", false],
      ["#GGGGGG", false],
      ["A1B2C3", false],
      ["", false],
      [null, false],
      [undefined, false],
    ])("%s → %s", (color, expected) => {
      expect(isHexColor(color as string | null | undefined)).toBe(expected);
    });
  });

  describe("getCategoryColor", () => {
    it("respeta un color hexadecimal válido", () => {
      expect(getCategoryColor("#123456", "INCIDENT")).toBe("#123456");
      expect(getCategoryColor("#abcdef", "MAINTENANCE")).toBe("#abcdef");
    });

    it.each([
      [null, "INCIDENT", "#EF4444"],
      [undefined, "INCIDENT", "#EF4444"],
      ["red", "INCIDENT", "#EF4444"],
      ["#12345", "MAINTENANCE", "#0EA5E9"],
      ["", "CASA_CLUB", "#8B5CF6"],
      [null, "DESCONOCIDO", "#EF4444"],
    ])("usa el acento del catálogo como respaldo (%s, %s)", (color, type, expected) => {
      expect(getCategoryColor(color as string | null | undefined, type)).toBe(expected);
    });
  });

  describe("getCategoryIcon", () => {
    it("cae en el icono genérico cuando falta o no existe", () => {
      const fallback = getCategoryIcon(null);
      expect(typeof fallback).toBe("function");
      expect(getCategoryIcon(undefined)).toBe(fallback);
      expect(getCategoryIcon("")).toBe(fallback);
      expect(getCategoryIcon("no-existe")).toBe(fallback);
    });

    it("resuelve nombres conocidos y alias", () => {
      const fallback = getCategoryIcon(null);
      expect(getCategoryIcon("alert")).not.toBe(fallback);
      expect(getCategoryIcon("alert")).toBe(getCategoryIcon("alert-circle"));
      expect(getCategoryIcon("lightning-bolt")).toBe(getCategoryIcon("toolbox"));
      expect(getCategoryIcon("home-city")).not.toBe(getCategoryIcon("pine-tree"));
    });
  });

  describe("getCategoryTint", () => {
    it("deriva fondo y borde con alfa del color base", () => {
      expect(getCategoryTint("#123456")).toEqual({
        backgroundColor: "#1234561F",
        borderColor: "#12345638",
        color: "#123456",
      });
    });
  });

  describe("normalizeSearch", () => {
    it.each([
      ["  ÁRBOL Ñandú ", "arbol nandu"],
      ["Casa Club", "casa club"],
      ["MÉXICO", "mexico"],
      ["", ""],
    ])("%j → %j", (input, expected) => {
      expect(normalizeSearch(input)).toBe(expected);
    });
  });

  describe("pluralize", () => {
    it.each([
      [0, "0 tipos"],
      [1, "1 tipo"],
      [2, "2 tipos"],
      [10, "10 tipos"],
    ])("%i → %s", (count, expected) => {
      expect(pluralize(count, "tipo", "tipos")).toBe(expected);
    });
  });

  describe("cx", () => {
    it("une solo las clases verdaderas", () => {
      expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
      expect(cx()).toBe("");
      expect(cx(false, null)).toBe("");
    });
  });

  describe("metadatos", () => {
    it("ordena los tres catálogos de reporte", () => {
      expect(CATALOG_ORDER).toEqual(["INCIDENT", "MAINTENANCE", "CASA_CLUB"]);
      expect(Object.keys(CATALOG_META)).toEqual(CATALOG_ORDER);
      expect(CATALOG_META.INCIDENT.label).toBe("Incidencias");
      expect(CATALOG_META.MAINTENANCE.accent).toMatch(/^#[0-9A-F]{6}$/i);
      expect(CATALOG_META.CASA_CLUB.singular).toBe("registro de Casa Club");
    });
  });
});
