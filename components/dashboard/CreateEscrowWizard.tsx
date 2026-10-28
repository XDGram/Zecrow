"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { PhysicalIllustration, DigitalIllustration } from "./GoodsIllustration";
import ListingCheck from "./ListingCheck";
import ChoiceSelect from "./ChoiceSelect";
import { CODE_RELEASE_TERMS, PLATFORM_DISPUTE_WINDOW_DAYS, getListingPreflight, validZecAmount, type ListingDraft } from "@/lib/listingCheck";
import { useWallet } from "@/components/wallet/WalletProvider";

type Type = "physical" | "digital";

const STEPS = ["Item", "Terms", "Review"];

type ImageItem = { name: string; dataUrl: string };

type Fields = {
  item: string;
  amount: string;
  desc: string;
  images: ImageItem[];
  deliveryMethod: string;
  shippingMethod: string;
  shippingCustom: string;
  expiry: string;
};

const INITIAL: Fields = {
  item: "",
  amount: "",
  desc: "",
  images: [],
  deliveryMethod: "link",
  shippingMethod: "tracked",
  shippingCustom: "",
  expiry: "72",
};

const SHIPPING_OPTIONS = [
  { value: "tracked", label: "Tracked courier", description: "DHL, UPS, FedEx or similar, with tracking." },
  { value: "standard", label: "Standard postal mail", description: "National post; may be untracked." },
  { value: "express", label: "Express / same-day", description: "Overnight or same-day courier." },
  { value: "pickup", label: "Local pickup", description: "Buyer collects the item in person." },
  { value: "freight", label: "Freight / pallet", description: "For large or heavy items." },
  { value: "custom", label: "Other (type your own)", description: "Describe how the item ships." },
];
const SHIPPING_LABELS: Record<string, string> = {
  tracked: "Tracked courier (DHL/UPS/FedEx or similar)",
  standard: "Standard postal mail",
  express: "Express or same-day courier",
  pickup: "Local pickup, collected in person",
  freight: "Freight / palletised shipping",
};
function resolveShipping(f: Fields): string {
  return f.shippingMethod === "custom" ? f.shippingCustom.trim() : SHIPPING_LABELS[f.shippingMethod] ?? "";
}

export default function CreateEscrowWizard() {
  const { session, connection } = useWallet();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<Type | null>(null);
  const [f, setF] = useState<Fields>(INITIAL);
  const [reviewedSignature, setReviewedSignature] = useState<string | null>(null);
  const [approvedItemKey, setApprovedItemKey] = useState<string | null>(null);
  const [savedOrder, setSavedOrder] = useState<{ number: number; code: string; link: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const set =
    (k: keyof Fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((prev) => ({ ...prev, [k]: e.target.value }));

  const draft = useMemo<ListingDraft | null>(() => type ? ({
    stage: step === 0 ? "item" : "terms", type, item: f.item, amount: f.amount, description: f.desc, images: f.images,
    deliveryMethod: type === "digital" ? f.deliveryMethod : undefined,
    shipping: type === "physical" ? resolveShipping(f) : undefined, confirmation: "code",
    expiryHours: f.expiry,
  }) : null, [type, f, step]);
  const draftSignature = useMemo(() => draft ? JSON.stringify(draft) : null, [draft]);
  const preflightReady = draft ? getListingPreflight(draft).ready : false;
  const aiApproved = Boolean(draftSignature && reviewedSignature === draftSignature);

  // The item step is where the AI meaningfully gates (item, photos, claims). Once it passes,
  // we remember that approval against the item fields themselves. The terms step holds only
  // platform-fixed terms plus the expiry choice, so it gates on completeness — not a second
  // AI pass the seller has no actionable way to satisfy.
  const itemKey = useMemo(
    () => (type ? JSON.stringify({ type, item: f.item, amount: f.amount, description: f.desc, images: f.images }) : null),
    [type, f.item, f.amount, f.desc, f.images],
  );
  const itemApproved = Boolean(approvedItemKey && approvedItemKey === itemKey);
  const canNext = step === 0 ? Boolean(type && aiApproved && preflightReady) : Boolean(itemApproved && preflightReady);
  const reportReview = useCallback(
    (signature: string | null) => {
      setReviewedSignature(signature);
      if (signature && step === 0) setApprovedItemKey(itemKey);
    },
    [step, itemKey],
  );
  const selectType = useCallback((nextType: Type) => {
    if (type !== nextType) setF((previous) => previous.images.length ? { ...previous, images: [] } : previous);
    setType(nextType);
  }, [type]);

  const createOrder = async () => {
    if (!type || !itemApproved || !preflightReady || !session || creating) return;
    setCreating(true);
    setCreateError("");
    try {
      const response = await fetch("/api/escrows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          item: f.item,
          amountZec: f.amount,
          description: f.desc,
          images: f.images,
          deliveryMethod: f.deliveryMethod,
          shipping: type === "physical" ? resolveShipping(f) : "",
          merchantPayoutAddress: connection?.shielded ?? "",
          linkExpiryHours: f.expiry,
        }),
      });
      const result = await response.json() as { order?: { number: number; code: string }; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error ?? "The order could not be saved.");
      setSavedOrder({
        number: result.order.number,
        code: result.order.code,
        link: `${window.location.origin}/e/${result.order.code}`,
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "The order could not be saved. Try again.");
    } finally {
      setCreating(false);
    }
  };

  if (savedOrder) {
    return <Success orderId={savedOrder.number} code={savedOrder.code} link={savedOrder.link} item={f.item} amount={f.amount} type={type!} />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-7">
      <aside className="min-w-0 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
        <ListingCheck draft={session ? draft : null} onPass={reportReview} />
        {!session && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-900">Sign in with Noir Wallet from the top bar to run the listing review and save this order.</p>}
      </aside>
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
      {/* stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                i < step ? "bg-ink text-white" : i === step ? "bg-accent text-white ring-4 ring-accent-wash" : "bg-bg-sunk text-ink-mute"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-[12.5px] font-medium ${i === step ? "text-ink" : "text-ink-mute"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`mx-1 h-px flex-1 ${i < step ? "bg-ink/40" : "bg-line"}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {step === 0 && <StepItem type={type} setType={selectType} f={f} set={set} setF={setF} />}
            {step === 1 && <StepTerms type={type!} f={f} setF={setF} />}
            {step === 2 && <StepReview type={type!} f={f} />}
          </motion.div>
        </AnimatePresence>

        {!canNext && <p className="mt-5 text-[11px] leading-4 text-amber-800">{!type ? "Choose a listing type to begin." : !preflightReady ? "Resolve the required details listed in the review panel." : step === 0 ? "Continue unlocks after the item passes a strong AI review." : "Select a link expiry to continue."}</p>}

        {createError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] leading-5 text-red-800" role="alert">{createError}</p>}

        <div className="mt-4 flex items-center justify-between border-t border-line pt-5">
          {step === 0 ? (
            <Link href="/dashboard/orders" className="text-[13px] font-medium text-ink-mute hover:text-ink">
              Cancel
            </Link>
          ) : (
            <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost !py-2.5 text-[13px]">
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="btn btn-dark !py-2.5 text-[13px] disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button type="button" disabled={!itemApproved || !preflightReady || !session || creating} onClick={createOrder} className="btn btn-dark !py-2.5 text-[13px] disabled:opacity-40">
              {creating ? "Saving order…" : "Create order link"}
            </button>
          )}
        </div>
      </div>
      </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-ink-faint">{session ? "Orders save to Supabase when configured, or local development storage in this preview. Testnet payment verification is not connected." : "Sign in with Noir Wallet before saving a merchant order."}</p>
    </div>
  );
}

/* ---------- Step 1: type + item ---------- */
function StepItem({
  type,
  setType,
  f,
  set,
  setF,
}: {
  type: Type | null;
  setType: (t: Type) => void;
  f: Fields;
  set: (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setF: React.Dispatch<React.SetStateAction<Fields>>;
}) {
  const [uploadError, setUploadError] = useState("");
  const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setUploadError("");
    const remaining = Math.max(0, 3 - f.images.length);
    const picked: ImageItem[] = [];
    try {
      for (const file of files.slice(0, remaining)) {
        if (!file.type.startsWith("image/")) throw new Error("Choose image files only.");
        if (file.size > 12 * 1024 * 1024) throw new Error("Each source photo must be under 12 MB.");
        picked.push({ name: file.name, dataUrl: await compressPhoto(file) });
      }
      setF((p) => ({ ...p, images: [...p.images, ...picked].slice(0, 3) }));
    } catch (error) { setUploadError(error instanceof Error ? error.message : "Could not read this image."); }
    e.target.value = "";
  };

  const removeImage = (idx: number) =>
    setF((p) => ({ ...p, images: p.images.filter((_, j) => j !== idx) }));

  return (
    <div className="space-y-5">
      <div>
        <Label>What are you selling?</Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <TypeCard active={type === "physical"} onClick={() => setType("physical")} title="Physical goods" desc="Shipped items" illustration={<PhysicalIllustration />} />
          <TypeCard active={type === "digital"} onClick={() => setType("digital")} title="Digital goods" desc="Files, keys, access" illustration={<DigitalIllustration />} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field label="Item name">
          <Input value={f.item} onChange={set("item")} placeholder="e.g. Vintage film camera" />
        </Field>
        <Field label="Amount">
          <span className="group relative block">
            <div className="flex items-center rounded-xl border border-line bg-white px-3.5 transition-colors duration-200 hover:border-ink/15 focus-within:border-ink/20">
              <input value={f.amount} onChange={set("amount")} inputMode="decimal" placeholder="0.00" className="w-full bg-transparent py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink-mute" />
              <span className="text-[12px] font-medium text-ink-mute">ZEC</span>
            </div>
            <Underline />
          </span>
        </Field>
      </div>

      <Field label="Description">
        <Textarea value={f.desc} onChange={set("desc")} placeholder="What the buyer is getting, condition, what's included…" />
        <Hint>{type === "physical" ? "Include quantity, condition, what is included, and any delivery timing or arrangements the buyer should know. Minimum 40 characters." : "Include quantity, condition, exactly what is included, and how the digital item will be delivered. Minimum 40 characters."}</Hint>
      </Field>

      {type === "physical" && (
        <Field label="Product photos">
          {f.images.length === 0 ? (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-bg-soft px-4 py-3 transition-colors hover:border-accent/50">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-ink-mute">
                <IconImage />
              </span>
              <span className="text-[12.5px] text-ink-soft">Upload up to 3 photos  -  at least one required</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} />
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {f.images.map((img, i) => (
                <div key={`${img.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-accent-soft bg-bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4 text-[9px] text-white">{img.name}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-ink-mute shadow-[var(--shadow-sm)] backdrop-blur transition-colors hover:text-ink"
                    aria-label="Remove photo"
                  >
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                  </button>
                </div>
              ))}
              {f.images.length < 3 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-bg-soft text-ink-mute transition-colors hover:border-accent/50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                  <span className="text-[10px]">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} />
                </label>
              )}
            </div>
          )}
          <p className="mt-1.5 text-[11px] text-ink-mute">{f.images.length}/3 added · buyers trust what they can see.</p>
          {uploadError && <p role="alert" className="mt-1 text-[11px] text-red-700">{uploadError}</p>}
        </Field>
      )}

      {type === "digital" && (
        <Field label="Delivery method">
          <ChoiceSelect
            value={f.deliveryMethod}
            onChange={(value) => setF((previous) => ({ ...previous, deliveryMethod: value }))}
            options={[
              { value: "link", label: "Download link", description: "Buyer receives a private link to the deliverable." },
              { value: "file", label: "File upload", description: "A file is delivered after the escrow is funded." },
              { value: "key", label: "License key", description: "A key or activation code is delivered to the buyer." },
            ]}
          />
        </Field>
      )}
    </div>
  );
}

/* ---------- Step 2: terms ---------- */
function StepTerms({
  type,
  f,
  setF,
}: {
  type: Type;
  f: Fields;
  setF: React.Dispatch<React.SetStateAction<Fields>>;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <PolicyTerm title="Release mechanism" description={CODE_RELEASE_TERMS} icon="code" />
        <PolicyTerm title="Dispute window" description={`${PLATFORM_DISPUTE_WINDOW_DAYS} days, set by Zecrow for every order.`} icon="time" />
      </div>

      {type === "physical" && (
        <Field label="Shipping method">
          <ChoiceSelect
            value={f.shippingMethod}
            onChange={(value) => setF((previous) => ({ ...previous, shippingMethod: value }))}
            options={SHIPPING_OPTIONS}
            ariaLabel="Shipping method"
          />
          {f.shippingMethod === "custom" && (
            <div className="mt-2">
              <Input
                value={f.shippingCustom}
                onChange={(e) => setF((previous) => ({ ...previous, shippingCustom: e.target.value }))}
                placeholder="e.g. Regional bike courier, delivered in 2–3 days"
                maxLength={120}
              />
            </div>
          )}
          <Hint>Tell the buyer how the item ships. Shown on the order and checked in the review.</Hint>
        </Field>
      )}

      <Field label="Payment link expires">
        <ChoiceSelect
          value={f.expiry}
          onChange={(value) => setF((previous) => ({ ...previous, expiry: value }))}
          options={[
            { value: "24", label: "24 hours", description: "Order link closes after one day." },
            { value: "72", label: "72 hours", description: "Order link closes after three days." },
            { value: "168", label: "7 days", description: "Order link closes after one week." },
          ]}
        />
      </Field>
    </div>
  );
}

function PolicyTerm({ title, description, icon }: { title: string; description: string; icon: "code" | "time" }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-bg-soft px-3.5 py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-accent-ink">
        {icon === "code" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M8 10V7a4 4 0 1 1 8 0v3M8.5 15h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
      </span>
      <span><span className="block text-[12px] font-semibold text-ink">{title}</span><span className="mt-0.5 block text-[10.5px] leading-4 text-ink-mute">{description}</span></span>
    </div>
  );
}

/* ---------- Step 3: review ---------- */
function StepReview({ type, f }: { type: Type; f: Fields }) {
  const rows: [string, string][] = [
    ["Type", type === "physical" ? "Physical goods" : "Digital goods"],
    ["Item", f.item || "Not set"],
    ["Amount", `${f.amount || "0.00"} ZEC`],
    ["Description", f.desc || "Not set"],
    type === "physical"
      ? ["Shipping method", resolveShipping(f) || "Not set"]
      : ["Delivery", f.deliveryMethod === "link" ? "Download link" : f.deliveryMethod === "file" ? "File upload" : "License key"],
    ["Release mechanism", "One-time Zecrow code after delivery"],
    ["Dispute window", `${PLATFORM_DISPUTE_WINDOW_DAYS} days (platform policy)`],
    ["Link expires", f.expiry === "168" ? "7 days" : `${f.expiry} hours`],
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[16px] font-semibold tracking-tight text-ink">Review escrow</span>
        <span className="annotation text-ink-faint">Draft</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        {rows.map(([k, v], i) => (
          <div key={k} className={`flex items-center justify-between px-4 py-3 text-[13px] ${i % 2 ? "bg-bg-soft" : "bg-white"}`}>
            <span className="text-ink-mute">{k}</span>
            <span className="max-w-[68%] break-words text-right font-medium text-ink">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent-soft bg-accent-wash/50 px-4 py-3 text-[12px] leading-5 text-accent-ink">
        <IconShield />
        <span>Planned managed escrow: funds would release under these terms or a human arbiter's decision. This prototype does not hold funds.</span>
      </div>
    </div>
  );
}

/* ---------- Success ---------- */
function Success({ orderId, code, link, item, amount, type }: { orderId: number; code: string; link: string; item: string; amount: string; type: Type }) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <h1 className="text-[22px] font-semibold tracking-tight text-ink">Order link created</h1>
      <p className="mt-2 text-[13.5px] text-ink-soft">
        Order #{orderId} · {item || (type === "physical" ? "Physical item" : "Digital item")} · {amount || "0.00"} ZEC. The order and its buyer link are saved.
      </p>

      <div className="card mt-6 p-5 text-left">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] leading-5 text-amber-950">
          <IconShield />
          <span>Payment verification is not connected yet. This link is for reviewing the saved order; no funds can be accepted.</span>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-bg-soft px-3 py-2.5">
          <span className="truncate font-mono text-[12.5px] text-ink">{link}</span>
          <button type="button" onClick={copyLink} className="ml-auto shrink-0 rounded-lg bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-white">{copied ? "Copied" : "Copy"}</button>
        </div>
        <p className="mt-3 text-[11px] text-ink-faint">Local demo · link expires with the order window</p>
      </div>

      <div className="mt-5 flex justify-center gap-3">
        <Link href={`/e/${code}`} className="btn btn-dark !py-2.5 text-[13px]">Open buyer link</Link>
        <Link href="/dashboard/orders" className="btn btn-ghost !py-2.5 text-[13px]">Go to orders</Link>
      </div>
    </motion.div>
  );
}

async function compressPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("Could not process this photo."); }
  try {
    let smallest = "";
    for (const maxSide of [1024, 896, 768, 640, 512]) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.62, 0.5, 0.42]) {
        smallest = canvas.toDataURL("image/jpeg", quality);
        if (smallest.length <= 250_000) return smallest;
      }
    }
    if (smallest.length > 300_000) throw new Error("This photo is too detailed to compress for review. Choose a smaller image.");
    return smallest;
  } finally {
    bitmap.close();
  }
}

/* ---------- bits ---------- */
function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-semibold text-ink">{children}</span>;
}
function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft">
        {label}
        {optional && <span className="text-[10.5px] font-normal text-ink-faint">optional</span>}
      </span>
      {children}
    </label>
  );
}
const fieldInput =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors duration-200 placeholder:text-ink-mute hover:border-ink/15 focus:border-ink/20";

function Underline() {
  return (
    <span className="pointer-events-none absolute inset-x-3 bottom-[3px] h-[2px] origin-center scale-x-0 rounded-full bg-accent transition-transform duration-300 ease-out group-focus-within:scale-x-100" />
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="group relative block">
      <input {...props} className={fieldInput} />
      <Underline />
    </span>
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <span className="group relative block">
      <textarea {...props} rows={3} className={`${fieldInput} resize-none`} />
      <Underline />
    </span>
  );
}
function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[11px] text-ink-mute">{children}</p>;
}
function TypeCard({ active, onClick, title, desc, illustration }: { active: boolean; onClick: () => void; title: string; desc: string; illustration: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-all ${
        active ? "border-accent bg-accent-wash/30 ring-1 ring-accent/40" : "border-line bg-white hover:border-ink/25 hover:bg-bg-soft/60"
      }`}
    >
      <div className="flex h-[60px] w-[60px] items-center justify-center">{illustration}</div>
      <span className="mt-1 block text-[13.5px] font-semibold text-ink">{title}</span>
      <span className="block text-[11.5px] text-ink-mute">{desc}</span>
    </button>
  );
}
function IconImage() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="8.5" cy="9" r="1.3" fill="currentColor" /></svg>; }
function IconShield() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>; }
