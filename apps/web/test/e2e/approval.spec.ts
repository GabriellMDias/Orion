import { test, expect, type Page } from "@playwright/test";

const webUrl = () => process.env.ORION_E2E_WEB_URL!;
const apiUrl = () => process.env.ORION_E2E_API_URL!;

async function connect(page: Page, token: string) {
  await page.getByLabel("Access token", { exact: true }).fill(token);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
}

test("owner creates, edits, submits and a different reviewer approves through PostgreSQL", async ({
  page,
}) => {
  const title = `Browser request ${Date.now()}`;
  await page.goto(webUrl());
  await connect(page, process.env.ORION_E2E_OWNER_TOKEN!);
  await expect(
    page.getByRole("heading", { name: "Approval requests" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Title" }).fill(title);
  await page
    .getByLabel("Description", { exact: true })
    .fill("Original description");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  await page
    .getByLabel("Description", { exact: true })
    .fill("Edited description");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator("p.description")).toHaveText("Edited description");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("SUBMITTED", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "All requests" }).click();
  await expect(
    page.getByRole("link", { name: new RegExp(title) }),
  ).toContainText("SUBMITTED");
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("alert")).toContainText("permission");
  await page.getByRole("button", { name: "Disconnect" }).click();
  await connect(page, process.env.ORION_E2E_REVIEWER_TOKEN!);
  await page.getByRole("link", { name: "All requests" }).click();
  await page.getByRole("link", { name: "For review" }).click();
  await expect(page).toHaveURL(/scope=reviewable/);
  await page.reload();
  await expect(page).toHaveURL(/scope=reviewable/);
  await connect(page, process.env.ORION_E2E_REVIEWER_TOKEN!);
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await expect(page).toHaveURL(new RegExp(`/requests/${id}$`));
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`/requests/${id}$`));
  await connect(page, process.env.ORION_E2E_REVIEWER_TOKEN!);
  await expect(page.getByRole("alert")).toContainText("not found");
  await page.getByRole("button", { name: "Disconnect" }).click();
  await connect(page, process.env.ORION_E2E_OWNER_TOKEN!);
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
});

test("a stale browser mutation reports conflict and preserves the newer database state", async ({
  page,
}) => {
  const title = `Stale request ${Date.now()}`;
  await page.goto(webUrl());
  await connect(page, process.env.ORION_E2E_OWNER_TOKEN!);
  await page.getByRole("textbox", { name: "Title" }).fill(title);
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  const response = await fetch(`${apiUrl()}/approval-requests/${id}/submit`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.ORION_E2E_OWNER_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ expectedVersion: 1 }),
  });
  expect(response.status).toBe(200);
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByRole("alert")).toContainText("changed");
  await page.getByRole("button", { name: "Reload current request" }).click();
  await expect(page.getByText("SUBMITTED", { exact: true })).toBeVisible();
});
