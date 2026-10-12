"use client";

interface Option<T extends string> {
  id: T;
  label: string;
}

/**
 * Arrow / Home / End keys for a `role="radiogroup"` of buttons: move focus and select,
 * as the ARIA radio pattern expects. Pair with a roving tabIndex (0 on the checked option).
 */
export function radioKeys(e: React.KeyboardEvent<HTMLElement>) {
  const radios = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
  const i = radios.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0) return;
  let n: number;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % radios.length;
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + radios.length) % radios.length;
  else if (e.key === "Home") n = 0;
  else if (e.key === "End") n = radios.length - 1;
  else return;
  e.preventDefault();
  radios[n].focus();
  radios[n].click();
}

/** Segmented radio group (real buttons) in the site's `.seg` style. */
export function Seg<T extends string>({
  label,
  options,
  value,
  onChange,
  size,
}: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "lg";
}) {
  return (
    <div className={`seg${size ? ` seg--${size}` : ""}`} role="radiogroup" aria-label={label} onKeyDown={radioKeys}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} tabIndex={value === o.id ? 0 : -1} className={value === o.id ? "is-on" : ""} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
