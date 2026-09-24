import { createContext, useContext, useState, type ReactNode } from "react";

type CredentialContext = {
  token: string | null;
  setToken: (token: string | null) => void;
};
const context = createContext<CredentialContext | null>(null);

export function CredentialProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  return (
    <context.Provider value={{ token, setToken }}>{children}</context.Provider>
  );
}

export function useCredential() {
  const value = useContext(context);
  if (!value) throw new Error("CredentialProvider is missing.");
  return value;
}
