import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";
import type { PropsWithChildren, ReactNode } from "react";

export function AppShell({
  children,
  actions,
}: PropsWithChildren<{ actions?: ReactNode }>) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[rgba(255,250,242,0.85)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            Победа
          </Link>
          <nav className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-soft)]">
            <NavItem to="/">Главная</NavItem>
            <NavItem to="/dashboard">Кабинет</NavItem>
            {actions}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

function NavItem({ to, children }: PropsWithChildren<{ to: string }>) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "rounded-full px-4 py-2 transition",
          isActive
            ? "bg-[color:var(--accent)] text-white"
            : "hover:bg-white/70",
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function Panel({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={clsx(
        "rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Title({
  eyebrow,
  heading,
  description,
}: {
  eyebrow?: string;
  heading: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--accent)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-extrabold tracking-tight text-[#24170f] md:text-5xl">
        {heading}
      </h1>
      {description ? (
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)] md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-dark)]",
        variant === "secondary" &&
          "border border-[color:var(--border)] bg-white/70 text-[#2b1d13] hover:bg-white",
        variant === "ghost" && "text-[color:var(--ink-soft)] hover:bg-white/70",
        variant === "danger" && "bg-[color:var(--danger)] text-white hover:opacity-90",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#3b2a1d]">
      <span>{label}</span>
      <input
        className={clsx(
          "rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(201,111,43,0.12)]",
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-[color:var(--ink-soft)]">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#3b2a1d]">
      <span>{label}</span>
      <textarea
        className="min-h-28 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(201,111,43,0.12)]"
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#3b2a1d]">
      <span>{label}</span>
      <select
        className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[rgba(201,111,43,0.12)]"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: PropsWithChildren<{ tone?: "neutral" | "success" | "warning" | "danger" }>) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        tone === "neutral" && "bg-[#efe4d6] text-[#72543d]",
        tone === "success" && "bg-[#dff3e8] text-[color:var(--success)]",
        tone === "warning" && "bg-[#fff0d7] text-[#a3631c]",
        tone === "danger" && "bg-[#fae0dc] text-[color:var(--danger)]",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[color:var(--border)] bg-white/50 p-8 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{description}</p>
    </div>
  );
}

export function Loader({ label = "Загрузка..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-full border border-[color:var(--border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[color:var(--ink-soft)] shadow-[var(--shadow)]">
        {label}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-5">
      <p className="text-sm text-[color:var(--ink-soft)]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}
