"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getNoirWallet, isNoirWalletInstalled, type ZcashConnectResult } from "@noir-wallet/sdk";

export type WalletStatus = "checking" | "disconnected" | "connecting" | "connected" | "wrong-network" | "error";

export type WalletSession = { address: string; signature: string; signedAt: number };

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
      setSession(null);
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

  // "Sign in with Zcash" — a derived-key signature proving control, unlinkable to the
  // main address. (Server-side verification is the next integration step.)
  const signIn = useCallback(async () => {
    const wallet = getNoirWallet();
    if (!wallet || !connection) return;
    setSigningIn(true);
    setMessage("");
    try {
      const nonce = Math.random().toString(36).slice(2, 10);
      const text = `zecrow.app wants you to sign in with your Zcash account.\n\nThis signature proves control of your wallet and never moves funds.\nNonce: ${nonce}`;
      const res = await wallet.zcash.signMessage(text, { signingMode: "derived" });
      setSession({ address: res.address, signature: res.signature, signedAt: Date.now() });
    } catch {
      setMessage("Sign-in was cancelled.");
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
