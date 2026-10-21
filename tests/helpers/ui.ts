import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { expect, vi } from "vitest";

/**
 * Sube un archivo por un `ITDropfile` en modo botón: abre el diálogo, adjunta y confirma.
 * El UI System espera 1.5 s fijos al confirmar ("simulación"); aquí se adelanta con timers falsos.
 */
export async function dropfile(user: UserEvent, buttonLabel: string | RegExp, file: File, dialog?: HTMLElement) {
  const scope = dialog ?? document.body;
  await user.click(within(scope).getByRole("button", { name: buttonLabel }));
  const inputs = document.querySelectorAll<HTMLInputElement>('[data-it-dialog] input[type="file"]');
  await user.upload(inputs[inputs.length - 1], file);
  const confirm = await screen.findByRole("button", { name: /confirmar/i });
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  try {
    fireEvent.click(confirm);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
  } finally {
    vi.useRealTimers();
  }
}

export const png = (name = "a.png") => new File(["x"], name, { type: "image/png" });
export const mp4 = (name = "a.mp4") => new File(["x"], name, { type: "video/mp4" });

/** Abre un `ITSearchSelect` (por su input) y elige una opción por su texto. */
export async function pickOption(user: UserEvent, input: HTMLElement, optionText: string | RegExp) {
  await user.click(input);
  const floating = await waitForFloating();
  await user.click(within(floating).getByText(optionText));
}

async function waitForFloating() {
  await waitFor(() => expect(document.querySelector("[data-it-floating]")).not.toBeNull());
  const all = document.querySelectorAll<HTMLElement>("[data-it-floating]");
  return all[all.length - 1];
}
