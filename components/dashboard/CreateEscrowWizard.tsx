"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PhysicalIllustration, DigitalIllustration } from "./GoodsIllustration";

type Type = "physical" | "digital";

const STEPS = ["Item", "Terms", "Review"];

type Fields = {
  item: string;
  amount: string;
  desc: string;
  images: string[];
  deliveryMethod: string;
  shipping: string;
  confirm: string;
  proof: string;
  release: string;
  dispute: string;
  expiry: string;
};

const INITIAL: Fields = {
  item: "",
  amount: "",
  desc: "",
  images: [],
  deliveryMethod: "link",
  shipping: "",
  confirm: "code",
  proof: "access",
  release: "",
  dispute: "7",
  expiry: "72",
};

export default function CreateEscrowWizard() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [type, setType] = useState<Type | null>(null);
  const [f, setF] = useState<Fields>(INITIAL);

  const set =
    (k: keyof Fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((prev) => ({ ...prev, [k]: e.target.value }));

  const canNext =
    step === 0
      ? Boolean(type && f.item.trim() && f.amount && (type !== "physical" || f.images.length > 0))
      : true;

  // Generated client-side after mount to avoid hydration mismatch.
  const [orderId, setOrderId] = useState(4817);
  const [link, setLink] = useState("zecrow.app/e/8f2a1c");
  useEffect(() => {
    setOrderId(4800 + Math.floor(Math.random() * 199));
    setLink(`zecrow.app/e/${Math.random().toString(36).slice(2, 8)}`);
  }, []);

  if (done) {
    return <Success orderId={orderId} link={link} item={f.item} amount={f.amount} type={type!} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
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
            {step === 0 && <StepItem type={type} setType={setType} f={f} set={set} setF={setF} />}
            {step === 1 && <StepTerms type={type!} f={f} set={set} />}
            {step === 2 && <StepReview type={type!} f={f} orderId={orderId} />}
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
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
            <button type="button" onClick={() => setDone(true)} className="btn btn-dark !py-2.5 text-[13px]">
              Create escrow
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-ink-faint">Nothing is charged here · a private payment link is generated for the buyer</p>
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
  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(e.target.files ?? []).map((file) => file.name);
    setF((p) => ({ ...p, images: [...p.images, ...names].slice(0, 3) }));
    e.target.value = "";
  };

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

      <Field label="Description" optional>
        <Textarea value={f.desc} onChange={set("desc")} placeholder="What the buyer is getting, condition, what's included…" />
      </Field>

      {type === "physical" && (
        <Field label="Product photos">
          {f.images.length === 0 ? (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-bg-soft px-4 py-3 transition-colors hover:border-accent/50">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-ink-mute">
                <IconImage />
              </span>
              <span className="text-[12.5px] text-ink-soft">Upload up to 3 photos — at least one required</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPickImages} />
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {f.images.map((name, i) => (
                <div key={`${name}-${i}`} className="relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-accent-soft bg-accent-wash/30 p-2 text-center">
                  <span className="text-accent-ink"><IconImage /></span>
                  <span className="w-full truncate px-1 text-[9.5px] text-ink-soft">{name}</span>
                  <button
                    type="button"
                    onClick={() => setF((p) => ({ ...p, images: p.images.filter((_, j) => j !== i) }))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink-mute shadow-[var(--shadow-sm)] transition-colors hover:text-ink"
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
        </Field>
      )}

      {type === "digital" && (
        <Field label="Delivery method">
          <Select value={f.deliveryMethod} onChange={set("deliveryMethod")}>
            <option value="link">Download link</option>
            <option value="file">File upload</option>
            <option value="key">License key</option>
          </Select>
        </Field>
      )}
    </div>
  );
}

/* ---------- Step 2: terms ---------- */
function StepTerms({
  type,
  f,
  set,
}: {
  type: Type;
  f: Fields;
  set: (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}) {
  return (
    <div className="space-y-5">
      {type === "physical" ? (
        <>
          <Field label="Shipping & delivery terms">
            <Textarea value={f.shipping} onChange={set("shipping")} placeholder="Carrier, estimated delivery, who pays shipping…" />
          </Field>
          <Field label="Delivery confirmation">
            <Select value={f.confirm} onChange={set("confirm")}>
              <option value="code">Buyer enters a one-time release code on receipt</option>
              <option value="tracking">Tracking marked delivered</option>
            </Select>
          </Field>
        </>
      ) : (
        <Field label="Proof of delivery">
          <Select value={f.proof} onChange={set("proof")}>
            <option value="access">Access / download log</option>
            <option value="confirm">Buyer confirms receipt</option>
          </Select>
          <Hint>Delivery is evidenced without exposing the private content itself.</Hint>
        </Field>
      )}

      <Field label="Release conditions" optional>
        <Textarea value={f.release} onChange={set("release")} placeholder="What must be true for funds to release to you." />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dispute window">
          <Select value={f.dispute} onChange={set("dispute")}>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
          </Select>
        </Field>
        <Field label="Payment link expires">
          <Select value={f.expiry} onChange={set("expiry")}>
            <option value="24">24 hours</option>
            <option value="72">72 hours</option>
            <option value="168">7 days</option>
          </Select>
        </Field>
      </div>
    </div>
  );
}

/* ---------- Step 3: review ---------- */
function StepReview({ type, f, orderId }: { type: Type; f: Fields; orderId: number }) {
  const rows: [string, string][] = [
    ["Type", type === "physical" ? "Physical goods" : "Digital goods"],
    ["Item", f.item || "—"],
    ["Amount", `${f.amount || "0.00"} ZEC`],
    type === "physical"
      ? ["Delivery", f.confirm === "code" ? "One-time release code" : "Tracking delivered"]
      : ["Delivery", f.deliveryMethod === "link" ? "Download link" : f.deliveryMethod === "file" ? "File upload" : "License key"],
    ["Dispute window", `${f.dispute} days`],
    ["Link expires", f.expiry === "168" ? "7 days" : `${f.expiry} hours`],
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[16px] font-semibold tracking-tight text-ink">Review escrow</span>
        <span className="annotation text-ink-faint">#{orderId}</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        {rows.map(([k, v], i) => (
          <div key={k} className={`flex items-center justify-between px-4 py-3 text-[13px] ${i % 2 ? "bg-bg-soft" : "bg-white"}`}>
            <span className="text-ink-mute">{k}</span>
            <span className="font-medium text-ink">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent-soft bg-accent-wash/50 px-4 py-3 text-[12px] leading-5 text-accent-ink">
        <IconShield />
        <span>Funds are held in managed escrow and only release on your terms, or a human arbiter's decision. Not trustless custody.</span>
      </div>
    </div>
  );
}

/* ---------- Success ---------- */
function Success({ orderId, link, item, amount, type }: { orderId: number; link: string; item: string; amount: string; type: Type }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <h1 className="text-[22px] font-semibold tracking-tight text-ink">Escrow created</h1>
      <p className="mt-2 text-[13.5px] text-ink-soft">
        Order #{orderId} · {item || (type === "physical" ? "Physical item" : "Digital item")} · {amount || "0.00"} ZEC. Share the private link so the buyer can fund it.
      </p>

      <div className="card mt-6 p-5">
        <FauxQR seed={link} />
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-bg-soft px-3 py-2.5">
          <span className="truncate font-mono text-[12.5px] text-ink">{link}</span>
          <button className="ml-auto shrink-0 rounded-lg bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-white">Copy</button>
        </div>
        <p className="mt-3 text-[11px] text-ink-faint">Testnet demo · link not live</p>
      </div>

      <div className="mt-5 flex justify-center gap-3">
        <Link href={`/e/${link.split("/e/")[1] ?? ""}`} className="btn btn-dark !py-2.5 text-[13px]">Preview buyer link</Link>
        <Link href="/dashboard/orders" className="btn btn-ghost !py-2.5 text-[13px]">Go to orders</Link>
      </div>
    </motion.div>
  );
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
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="group relative block">
      <select {...props} className={`${fieldInput} cursor-pointer appearance-none pr-9`} />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute">
        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
function FauxQR({ seed }: { seed: string }) {
  const n = 21;
  const cells = [];
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) % 100000;
  for (let i = 0; i < n * n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const x = i % n;
    const y = Math.floor(i / n);
    const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    const on = finder ? (x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5) || x === n - 1 || x === n - 7 || y === n - 7) : s % 100 > 52;
    cells.push(on);
  }
  return (
    <div className="mx-auto grid w-40" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-hidden>
      {cells.map((on, i) => (
        <span key={i} className="aspect-square" style={{ background: on ? "#0b0b0d" : "transparent" }} />
      ))}
    </div>
  );
}

function IconImage() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="8.5" cy="9" r="1.3" fill="currentColor" /></svg>; }
function IconShield() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>; }
