import { useState, type FormEvent } from "react";
import { failureMessage } from "./api.js";

export function AccessTokenForm({
  onConnect,
}: {
  onConnect: (token: string) => void;
}) {
  const [entry, setEntry] = useState("");
  function connect(event: FormEvent) {
    event.preventDefault();
    const value = entry.trim();
    if (!value) return;
    onConnect(value);
    setEntry("");
  }
  return (
    <section
      className="panel credential-panel"
      aria-labelledby="credential-title"
    >
      <p className="eyebrow">Access</p>
      <h1 id="credential-title">Connect with an access token</h1>
      <p>
        Enter a bearer access token from a trusted issuer. The token stays in
        memory and is cleared on refresh or disconnect.
      </p>
      <form onSubmit={connect} className="form-stack">
        <label htmlFor="access-token">Access token</label>
        <input
          id="access-token"
          type="password"
          autoComplete="off"
          value={entry}
          onChange={(event) => setEntry(event.target.value)}
          required
        />
        <button type="submit" className="button-primary">
          Connect
        </button>
      </form>
    </section>
  );
}

export function ErrorNotice({
  error,
  onReload,
  operation = "read",
}: {
  error: unknown;
  onReload?: () => void;
  operation?: "read" | "create" | "write";
}) {
  return (
    <div role="alert" className="notice notice-error">
      <strong>{failureMessage(error, operation)}</strong>
      {onReload && (
        <button type="button" onClick={onReload}>
          Reload current request
        </button>
      )}
    </div>
  );
}
