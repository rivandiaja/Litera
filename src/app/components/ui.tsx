import { clsx } from "clsx";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function cn(...inputs: (string | undefined | false | null | 0)[]) {
  return clsx(inputs);
}

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "white" | "dark";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = "primary", size = "md", children, loading, icon, className, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shrink-0 select-none";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.97] shadow-sm shadow-indigo-200/60",
    secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-[0.97]",
    ghost: "text-slate-600 hover:bg-slate-100 active:scale-[0.97]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.97]",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.97]",
    white: "bg-white text-slate-800 hover:bg-slate-50 shadow-sm active:scale-[0.97]",
    dark: "bg-[#0C0D1A] text-white hover:bg-[#1a1b2e] active:scale-[0.97]",
  };
  const sizes: Record<ButtonSize, string> = {
    xs: "px-2.5 py-1 text-xs gap-1.5",
    sm: "px-3.5 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-3.5 text-base",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ?? null}
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export type BadgeVariant = "indigo" | "mint" | "coral" | "gray" | "lavender" | "warning" | "sky" | "rose" | "dark";

export function Badge({ variant = "gray", children, className }: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  const variants: Record<BadgeVariant, string> = {
    indigo: "bg-indigo-100/80 text-indigo-700",
    mint: "bg-emerald-100/80 text-emerald-700",
    coral: "bg-orange-100/80 text-orange-700",
    gray: "bg-slate-100 text-slate-600",
    lavender: "bg-violet-100/80 text-violet-700",
    warning: "bg-amber-100/80 text-amber-700",
    sky: "bg-sky-100/80 text-sky-700",
    rose: "bg-rose-100/80 text-rose-700",
    dark: "bg-[#0C0D1A] text-white",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", variants[variant], className)}>
      {children}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.06),0_1px_2px_rgba(12,13,26,0.04)]",
        onClick && "cursor-pointer hover:shadow-[0_4px_12px_rgba(12,13,26,0.08),0_2px_4px_rgba(12,13,26,0.05)] hover:border-[rgba(12,13,26,0.12)] transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  error?: string;
  hint?: string;
  wrapperClass?: string;
}

export function InputField({ label, icon, trailingIcon, error, hint, wrapperClass, className, ...props }: InputFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClass)}>
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</div>}
        <input
          className={cn(
            "w-full py-2.5 bg-slate-50/80 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-all",
            icon ? "pl-10 pr-4" : "px-4",
            trailingIcon ? "pr-11" : "",
            error ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-[rgba(12,13,26,0.1)]",
            className
          )}
          {...props}
        />
        {trailingIcon && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">{trailingIcon}</div>}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClass?: string;
}

export function TextareaField({ label, error, hint, wrapperClass, className, ...props }: TextareaFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClass)}>
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <textarea
        className={cn(
          "w-full px-4 py-2.5 bg-slate-50/80 border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-all resize-none",
          error ? "border-red-300" : "",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ initials, color = "bg-indigo-500", size = "md", src }: { initials: string; color?: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; src?: string }) {
  const sizes = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base", xl: "w-14 h-14 text-lg" };
  if (src) return <img src={src} alt={initials} className={cn("rounded-full object-cover ring-2 ring-white", sizes[size])} />;
  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold text-white shrink-0 ring-2 ring-white", color, sizes[size])}>
      {initials}
    </div>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px bg-[rgba(12,13,26,0.07)]", className)} />;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

export function Chip({ children, active, onClick, className }: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer",
        active
          ? "bg-[#0C0D1A] text-white shadow-[0_2px_8px_rgba(12,13,26,0.2)]"
          : "bg-white text-slate-600 border border-[rgba(12,13,26,0.09)] hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/60 shadow-[0_1px_2px_rgba(12,13,26,0.05)]",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── StatusDot ────────────────────────────────────────────────────────────────

type IndexStatus = "indexed" | "pending" | "processing" | "failed";

export function StatusDot({ status }: { status: IndexStatus }) {
  const config: Record<IndexStatus, { label: string; dot: string; text: string; bg: string }> = {
    indexed:    { label: "Terindeks",  dot: "bg-emerald-400",           text: "text-emerald-700", bg: "bg-emerald-50" },
    pending:    { label: "Menunggu",   dot: "bg-amber-400",              text: "text-amber-700",   bg: "bg-amber-50"   },
    processing: { label: "Memproses",  dot: "bg-indigo-400 animate-pulse", text: "text-indigo-700", bg: "bg-indigo-50" },
    failed:     { label: "Gagal",      dot: "bg-red-400",                text: "text-red-700",     bg: "bg-red-50"     },
  };
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
      {c.label}
    </span>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

export function ProgressBar({ value, className, color = "bg-indigo-500" }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn("w-full bg-slate-100 rounded-full h-1.5 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-300", color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
