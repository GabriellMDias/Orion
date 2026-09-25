import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { AccessTokenForm, ErrorNotice } from "../src/components.js";
import { ApiFailure } from "../src/api.js";

test("the token form supports keyboard submission without persisting the credential", async () => {
  const connected = vi.fn();
  const screen = await render(<AccessTokenForm onConnect={connected} />);
  const field = screen.getByLabelText("Access token");
  await expect.element(field).toHaveAttribute("type", "password");
  await field.fill("  synthetic-token  ");
  await userEvent.keyboard("{Enter}");
  expect(connected).toHaveBeenCalledWith("synthetic-token");
  await expect.element(field).toHaveValue("");
});

test("a stale update exposes an accessible reload action", async () => {
  const reload = vi.fn();
  const screen = await render(
    <ErrorNotice
      error={
        new ApiFailure(
          409,
          "RESOURCE_VERSION_CONFLICT",
          "test-request",
          "Changed",
        )
      }
      onReload={reload}
    />,
  );
  await expect.element(screen.getByRole("alert")).toBeVisible();
  await expect
    .element(
      screen.getByText("This request changed. Reload it before trying again."),
    )
    .toBeVisible();
  await screen.getByRole("button", { name: "Reload current request" }).click();
  expect(reload).toHaveBeenCalledOnce();
});
