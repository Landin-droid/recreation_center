import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";
import React, { useEffect } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { authApi } from "@features/auth/api";
import { useAuthStore } from "@features/auth/model/auth-store";

export function AppShell({
  children,
  actions,
}: PropsWithChildren<{ actions?: ReactNode }>) {
  const { accessToken, clearSession } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[rgba(255,250,242,0.85)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-xl font-black tracking-tighter text-[#c96f2b]">
            ПОБЕДА
          </Link>
          <nav className="flex items-center gap-1 text-sm font-bold text-[color:var(--ink-soft)]">
            <NavItem to="/">Главная</NavItem>
            <NavItem to="/rentals">Прокат</NavItem>
            <NavItem to="/booking">Бронирование</NavItem>
            {accessToken ? (
              <>
                <NavItem to="/profile">Кабинет</NavItem>
                <Button
                  variant="ghost"
                  className="ml-2 text-xs opacity-70 hover:opacity-100"
                  onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <NavItem to="/login">Войти</NavItem>
            )}
            {actions}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      <footer className="border-t border-[color:var(--border)] py-12 text-center text-sm text-[color:var(--ink-soft)]">
        <div className="mx-auto max-w-7xl px-6">
          <p>
            © {new Date().getFullYear()} База отдыха «Победа». Все права
            защищены.
          </p>
        </div>
      </footer>
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
      }>
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
      )}>
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
        variant === "danger" &&
          "bg-[color:var(--danger)] text-white hover:opacity-90",
        className,
      )}
      {...props}>
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
      {hint ? (
        <span className="text-xs text-[color:var(--ink-soft)]">{hint}</span>
      ) : null}
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
        {...props}>
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
      )}>
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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-xl font-bold text-[#24170f]">{title}</h3>
      <p className="mt-2 text-[color:var(--ink-soft)]">{description}</p>
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  footer?: ReactNode;
}>) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <Panel className="w-full max-w-md space-y-6 animate-in zoom-in duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#24170f]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[color:var(--ink-soft)] hover:text-black transition">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="text-[#3b2a1d] leading-relaxed">{children}</div>
        {footer && (
          <div className="pt-4 flex justify-end gap-3 border-t border-[color:var(--border)]">
            {footer}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function Toast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "info" | "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={clsx(
        "fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl animate-in slide-in-from-right duration-300",
        type === "success" && "bg-green-600 text-white",
        type === "error" && "bg-red-600 text-white",
        type === "info" && "bg-[#24170f] text-white",
      )}>
      <span className="text-sm font-bold">{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
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

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-5">
      <p className="text-sm text-[color:var(--ink-soft)]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}
