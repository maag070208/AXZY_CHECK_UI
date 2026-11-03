import { render, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { RoleLogo } from "@app/core/components/RoleLogo";
import { useRolePalette } from "@app/core/hooks/useRolePalette";
import { setRoleFavicon } from "@app/core/utils/roleFavicon";
import store from "@app/core/store/store";
import { authAs } from "../../helpers/render";

const imgSrc = (container: HTMLElement) => container.querySelector("img")?.getAttribute("src") ?? "";

describe("branding del rol CLIENT", () => {
  it("RoleLogo usa el logo propio de CLIENT y sus alias", () => {
    const { container, rerender } = render(<RoleLogo role="CLIENT" />);
    expect(imgSrc(container)).toContain("client");

    rerender(<RoleLogo role="client" />);
    expect(imgSrc(container)).toContain("client");

    rerender(<RoleLogo role="cliente" />);
    expect(imgSrc(container)).toContain("client");
  });

  it("el logo de CLIENT no cae al de ADMIN", () => {
    const { container } = render(<RoleLogo role="CLIENT" />);
    expect(imgSrc(container)).not.toContain("admin");
  });

  it("el favicon del rol CLIENT tiene identidad propia", () => {
    setRoleFavicon("CLIENT");
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    expect(link?.href).toContain("client");

    setRoleFavicon("cliente");
    expect(link?.href).toContain("client");
    expect(link?.href).not.toContain("admin");
  });

  it("useRolePalette devuelve la paleta ámbar de CLIENT", () => {
    authAs("CLIENT");
    const { result } = renderHook(() => useRolePalette(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
    expect(result.current.role).toBe("CLIENT");
    expect(result.current.primary).toBe("#B45309");
    expect(result.current.primaryTextClass).toBe("text-amber-800");
  });
});
