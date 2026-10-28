"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getNoirWallet, isNoirWalletInstalled, type ZcashConnectResult } from "@noir-wallet/sdk";

export type WalletStatus = "checking" | "disconnected" | "connecting" | "connected" | "wrong-network" | "error";

export type WalletSession = { address: string; issuedAt: number; expiresAt: number };

type WalletContextValue = {
  status: WalletStatus;
  connection: ZcashConnectResult | null;
  session: WalletSession | null;
  message: string;
  installed: boolean;
  signingIn: boolean;
  connect: () => Promise<void>;
  signIn: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Real shielded payment. Returns the on-chain txid, or throws. */
  sendPayment: (params: { to: string; amount: string; memo?: string }) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function isZcashTestnet(result: ZcashConnectResult) {
  return result.shielded.toLowerCase().startsWith("utest1");
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("checking");
  const [connection, setConnection] = useState<ZcashConnectResult | null>(null);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [message, setMessage] = useState("");
  const [installed, setInstalled] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const activeRef = useRef(true);

  const accept = useCallback((result: ZcashConnectResult | null) => {
    if (!result) {
      setConnection(null);
      setStatus("disconnected");
      return false;
    }
    if (!isZcashTestnet(result)) {
      setConnection(null);
      setStatus("wrong-network");
      return false;
    }
    setConnection(result);
    setMessage("");
    setStatus("connected");
    return true;
  }, []);

  // Detect the extension and restore any silent connection, and subscribe to events.
  useEffect(() => {
    activeRef.current = true;
    setInstalled(isNoirWalletInstalled());
    const wallet = getNoirWallet();
    if (!wallet) {
      setStatus("disconnected");
      return;
    }

    const refresh = async () => {
      try {
        const result = await wallet.zcash.getAccounts();
        if (!activeRef.current) return;
        const ok = accept(result);
        if (result && !ok) await wallet.zcash.disconnect().catch(() => undefined);
      } catch {
        if (activeRef.current) setStatus("disconnected");
      }
    };

    const onAccounts = () => void refresh();
    const onChain = (chain: { network?: string }) => {
      if (chain?.network && chain.network.toLowerCase() !== "testnet") {
        setConnection(null);
        setSession(null);
        void fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        setStatus("wrong-network");
      } else {
        void refresh();
      }
    };

    wallet.zcash.on("accountsChanged", onAccounts);
    wallet.zcash.on("chainChanged", onChain);
    void refresh();

    return () => {
      activeRef.current = false;
      wallet.zcash.removeListener("accountsChanged", onAccounts);
      wallet.zcash.removeListener("chainChanged", onChain);
    };
  }, [accept]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { session?: WalletSession | null };
        if (active && response.ok && result.session) setSession(result.session);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setMessage("");
    const wallet = getNoirWallet();
    if (!wallet) {
      setStatus("disconnected");
      setMessage("Install the Noir Wallet testnet extension, then reload this page.");
      return;
    }
    try {
      const result = await wallet.zcash.connect();
      const ok = accept(result);
      if (!ok) {
        await wallet.zcash.disconnect().catch(() => undefined);
        setMessage("This is not a Zcash testnet account. Install and connect the Noir Wallet testnet build.");
      }
    } catch {
      setStatus("error");
      setMessage("The wallet connection was cancelled or failed. Try again from Noir Wallet.");
    }
  }, [accept]);

  // Sign a server-issued, one-time challenge. The server verifies the Zcash message
  // signature before it creates the HTTP-only session cookie.
  const signIn = useCallback(async () => {
    const wallet = getNoirWallet();
    if (!wallet || !connection) return;
    setSigningIn(true);
    setMessage("");
    try {
      const challengeResponse = await fetch("/api/auth/challenge", { method: "POST" });
      const challenge = await challengeResponse.json() as { message?: string; error?: string };
      if (!challengeResponse.ok || !challenge.message) throw new Error(challenge.error ?? "Could not start wallet sign-in.");

      const signature = await wallet.zcash.signMessage(challenge.message, { signingMode: "derived" });
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature: signature.signature, address: signature.address, pubkey: signature.pubkey }),
      });
      const verified = await verifyResponse.json() as { session?: WalletSession; error?: string };
      if (!verifyResponse.ok || !verified.session) throw new Error(verified.error ?? "Wallet signature verification failed.");
      setSession(verified.session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in was cancelled.");
    } finally {
      setSigningIn(false);
    }
  }, [connection]);

  const sendPayment = useCallback(
    async ({ to, amount, memo }: { to: string; amount: string; memo?: string }) => {
      const wallet = getNoirWallet();
      if (!wallet) throw new Error("wallet-unavailable");
      // The wallet selects notes, builds the proof, authorises and broadcasts.
      return wallet.zcash.sendTransaction({ to, amount, memo, fundingSource: "shielded" });
    },
    []
  );

  const disconnect = useCallback(async () => {
    const wallet = getNoirWallet();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await wallet?.zcash.disconnect();
    } finally {
      setConnection(null);
      setSession(null);
      setStatus("disconnected");
      setMessage("Wallet disconnected.");
    }
  }, []);

  return (
    <WalletContext.Provider value={{ status, connection, session, message, installed, signingIn, connect, signIn, disconnect, sendPayment }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export function shortAddress(address: string) {
  if (!address || address.length < 24) return address || "";
  return `${address.slice(0, 11)}…${address.slice(-8)}`;
}
