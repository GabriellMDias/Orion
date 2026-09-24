import { describe, expect, it } from "vitest";
import { parseServerConfig, clientConfigFrom } from "../src/config.js";

describe("Approval Request runtime configuration", () => {
  const complete = {
    ORION_ENV: "test",
    ORION_DATABASE_URL: "postgresql://runtime:synthetic@127.0.0.1:5432/orion",
    ORION_TOKEN_ISSUER: "https://issuer.example.test/",
    ORION_TOKEN_AUDIENCE: "orion-api",
    ORION_TOKEN_JWKS_URL: "https://issuer.example.test/jwks",
  };
  it("requires an all-or-none server-only identity/database boundary", () => {
    expect(() => parseServerConfig(complete)).not.toThrow();
    expect(() =>
      parseServerConfig({ ...complete, ORION_TOKEN_JWKS_URL: undefined }),
    ).toThrow();
    expect(() => parseServerConfig({ ORION_ENV: "production" })).toThrow();
    expect(() =>
      parseServerConfig({
        ...complete,
        ORION_ENV: "production",
        ORION_TOKEN_JWKS_URL: "http://issuer.example.test/jwks",
      }),
    ).toThrow();
    expect(() =>
      parseServerConfig({
        ...complete,
        ORION_TOKEN_JWKS_URL: "http://127.0.0.1:8080/jwks",
      }),
    ).not.toThrow();
    expect(clientConfigFrom(parseServerConfig(complete))).toEqual({});
  });
  it("does not interpret migration credentials in the runtime parser", () => {
    const parsed = parseServerConfig({
      ...complete,
      ORION_MIGRATION_DATABASE_URL:
        "postgresql://migration:synthetic@127.0.0.1/orion",
    });
    expect(JSON.stringify(parsed)).not.toContain("migration");
  });
});
