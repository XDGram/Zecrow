"use client";

import { useEffect, useId, useRef, useState } from "react";

export type ChoiceOption = { value: string; label: string; description?: string };

type Props = {
  options: ChoiceOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
};

export default function ChoiceSelect({ options, value, defaultValue, onChange, ariaLabel }: Props) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();
  const selectedValue = value ?? internalValue;
  const selected = options.find((option) => option.value === selectedValue) ?? options[0];

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  const choose = (option: ChoiceOption) => {
    if (value === undefined) setInternalValue(option.value);
    onChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const toggle = () => {
    const index = Math.max(0, options.findIndex((option) => option.value === selectedValue));
    setActiveIndex(index);
    setOpen((current) => !current);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => event.key === "ArrowDown" ? Math.min(index + 1, options.length - 1) : Math.max(index - 1, 0));
            setOpen(true);
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) toggle();
          }
        }}
        className={`group flex min-h-[44px] w-full items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-left text-[13.5px] text-ink outline-none transition-colors ${open ? "border-accent ring-2 ring-accent/15" : "border-line hover:border-ink/20 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{selected?.label ?? "Choose an option"}</span>
          {selected?.description && <span className="mt-0.5 block truncate text-[10.5px] text-ink-mute">{selected.description}</span>}
        </span>
        <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-bg-soft text-ink-soft transition-transform ${open ? "rotate-180 border-accent-soft text-accent-ink" : ""}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </button>

      {open && (
        <div id={listId} role="listbox" aria-label={ariaLabel ?? "Choose an option"} className="absolute inset-x-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[var(--shadow-lg)] ring-1 ring-black/[0.03]">
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            return (
              <button
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node; }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onFocus={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const next = event.key === "ArrowDown" ? Math.min(index + 1, options.length - 1) : Math.max(index - 1, 0);
                    setActiveIndex(next);
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    choose(option);
                  }
                }}
                onClick={() => choose(option)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${isSelected ? "bg-accent-wash/70" : activeIndex === index ? "bg-bg-soft" : "bg-white hover:bg-bg-soft"}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${isSelected ? "border-accent-soft bg-white text-accent-ink" : "border-line bg-white text-ink-faint"}`}>
                  {isSelected ? <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[12.5px] font-semibold ${isSelected ? "text-ink" : "text-ink-soft"}`}>{option.label}</span>
                  {option.description && <span className="mt-0.5 block text-[10.5px] leading-4 text-ink-mute">{option.description}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
