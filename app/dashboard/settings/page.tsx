"use client";

import { useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState({ funding: true, delivery: true, dispute: true, weekly: false });

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile, notifications and escrow defaults." />

      <div className="mx-auto max-w-2xl space-y-5">
        {/* profile */}
        <Section title="Profile">
          <Field label="Display name">
            <input defaultValue="Emma's Store" className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors hover:border-ink/15 focus:border-ink/20" />
          </Field>
          <Field label="Role">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-wash px-3 py-1.5 text-[12px] font-medium text-accent-ink">Merchant</span>
          </Field>
          <Field label="Shielded address">
            <span className="font-mono text-[12.5px] text-ink-soft">u1 fq…9kd2</span>
          </Field>
        </Section>

        {/* notifications */}
        <Section title="Notifications">
          <ToggleRow label="Order funded" desc="When a buyer funds one of your escrows" on={notes.funding} onChange={(v) => setNotes((p) => ({ ...p, funding: v }))} />
          <ToggleRow label="Delivery confirmed" desc="When a buyer confirms receipt" on={notes.delivery} onChange={(v) => setNotes((p) => ({ ...p, delivery: v }))} />
          <ToggleRow label="Dispute opened" desc="When a case is opened against an order" on={notes.dispute} onChange={(v) => setNotes((p) => ({ ...p, dispute: v }))} />
          <ToggleRow label="Weekly summary" desc="A digest of your escrow activity" on={notes.weekly} onChange={(v) => setNotes((p) => ({ ...p, weekly: v }))} />
        </Section>

        {/* defaults */}
        <Section title="Escrow defaults">
          <Field label="Default dispute window">
            <Select defaultValue="7">
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
            </Select>
          </Field>
          <Field label="Default link expiry">
            <Select defaultValue="72">
              <option value="24">24 hours</option>
              <option value="72">72 hours</option>
              <option value="168">7 days</option>
            </Select>
          </Field>
        </Section>

        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-[12.5px] font-medium text-emerald-600">Saved ✓</span>}
          <button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); }} className="btn btn-dark !py-2.5 text-[13px]">
            Save changes
          </button>
        </div>
        <p className="text-center text-[11px] text-ink-faint">Illustrative · settings are not persisted in this demo</p>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="mb-4 text-[14px] font-semibold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <div className="min-w-0 max-w-[60%] flex-1 text-right">{children}</div>
    </div>
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="w-full cursor-pointer rounded-xl border border-line bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors hover:border-ink/15 focus:border-ink/20" />;
}
function ToggleRow({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[13px] font-medium text-ink">{label}</div>
        <div className="text-[11.5px] text-ink-mute">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-bg-sunk"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
