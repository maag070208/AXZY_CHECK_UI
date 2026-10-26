import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonAvatar } from "@app/core/components/PersonAvatar";

describe("PersonAvatar", () => {
  it("usa Blobatar cuando la persona no tiene foto", () => {
    render(<PersonAvatar name="Ana Pérez" size={40} />);
    expect(screen.getByRole("img", { name: "Ana Pérez" })).toBeInTheDocument();
  });

  it("muestra la foto cuando existe", () => {
    render(<PersonAvatar name="Ana Pérez" photoUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" size={40} />);
    expect(screen.getByAltText("Ana Pérez")).toHaveAttribute("src", expect.stringContaining("data:image/svg+xml"));
  });
});
