import { Link, NavLink } from "react-router-dom";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { authApi } from "@features/auth/api";
import { useAuthStore } from "@features/auth/model/auth-store";

export function AppShell({
  children,
  actions,
}: PropsWithChildren<{ actions?: ReactNode }>) {
  const { accessToken, clearSession } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <header className="sticky top-0 z-[70] border-b border-[color:var(--border)] bg-[#fffaf2]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="shrink-0 text-lg font-black tracking-tighter text-[#c96f2b] sm:text-xl">
            ПОБЕДА
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 whitespace-nowrap text-sm font-bold text-[color:var(--ink-soft)] md:flex">
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
          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/75 text-[#3b2a1d] shadow-sm transition hover:bg-white md:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMenuOpen}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
        {isMenuOpen ? (
          <nav className="border-t border-[color:var(--border)] bg-[#fffaf2]/98 px-4 py-3 shadow-lg md:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-sm font-bold text-[color:var(--ink-soft)]">
              <NavItem to="/" onClick={() => setIsMenuOpen(false)}>Главная</NavItem>
              <NavItem to="/rentals" onClick={() => setIsMenuOpen(false)}>Прокат</NavItem>
              <NavItem to="/booking" onClick={() => setIsMenuOpen(false)}>Бронирование</NavItem>
              {accessToken ? (
                <>
                  <NavItem to="/profile" onClick={() => setIsMenuOpen(false)}>Кабинет</NavItem>
                  <Button
                    variant="ghost"
                    className="justify-start px-3 py-2 text-sm"
                    onClick={handleLogout}>
                    Выйти
                  </Button>
                </>
              ) : (
                <NavItem to="/login" onClick={() => setIsMenuOpen(false)}>Войти</NavItem>
              )}
              {actions}
            </div>
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
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

function NavItem({
  to,
  children,
  onClick,
}: PropsWithChildren<{ to: string; onClick?: () => void }>) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          "rounded-full px-3 py-2 transition sm:px-4",
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
        "rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow)] backdrop-blur sm:rounded-[28px] sm:p-6",
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
      <h1 className="text-3xl font-extrabold tracking-tight text-[#24170f] sm:text-4xl md:text-5xl">
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
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
}) {
  return (
    <label className={clsx("flex flex-col gap-2 text-sm font-medium text-[#3b2a1d]", className)}>
      <span>{label}</span>
      <span className="relative">
        <select
          className="w-full appearance-none rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 pr-11 text-[#2b1d13] shadow-sm outline-none transition hover:border-[rgba(201,111,43,0.38)] focus:border-[color:var(--accent)] focus:bg-white focus:ring-4 focus:ring-[rgba(201,111,43,0.12)]"
          {...props}>
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--accent)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
        </svg>
      </span>
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4">
      <Panel className="my-auto w-full max-w-md space-y-6 animate-in zoom-in duration-300">
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
