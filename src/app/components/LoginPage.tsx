import { useEffect, useState } from "react";
import { BookOpen, Mail, Lock, User, Hash, Users, Eye, EyeOff, ArrowRight, GraduationCap, FileText, Layers, Search, Shield } from "lucide-react";
import { useApp } from "../context";
import { useAuth } from "../../contexts/AuthContext";
import { getSafeErrorMessage } from "../../lib/api-error";
import { cn } from "./ui";
import { toast } from "sonner";

// ── Glass input ───────────────────────────────────────────────────────────────

function GlassInput({
  label, name, type = "text", placeholder, icon, trailingIcon, defaultValue, required, hint,
}: {
  label: string; type?: string; placeholder: string;
  name: string;
  icon?: React.ReactNode; trailingIcon?: React.ReactNode;
  defaultValue?: string; required?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-white/60 uppercase tracking-[0.1em]">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          className={cn(
            "w-full py-3 bg-white/15 border border-white/25 rounded-xl text-sm text-white placeholder:text-white/35 focus:outline-none focus:bg-white/22 focus:border-white/50 transition-all",
            icon ? "pl-10 pr-4" : "px-4",
            trailingIcon ? "pr-11" : ""
          )}
        />
        {trailingIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {trailingIcon}
          </div>
        )}
      </div>
      {hint && <p className="text-[10px] text-white/35 font-medium">{hint}</p>}
    </div>
  );
}

// ── Light input (for register form that's longer) ─────────────────────────────

function LightInput({
  label, name, type = "text", placeholder, icon, required, hint,
}: {
  label: string; type?: string; placeholder: string;
  name: string;
  icon?: React.ReactNode; required?: boolean; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-white/60 uppercase tracking-[0.1em]">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          className={cn(
            "w-full py-2.5 bg-white/15 border border-white/25 rounded-xl text-sm text-white placeholder:text-white/35 focus:outline-none focus:bg-white/22 focus:border-white/50 transition-all",
            icon ? "pl-10 pr-4" : "px-4"
          )}
        />
      </div>
      {hint && <p className="text-[10px] text-white/35">{hint}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LoginPage({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const { navigate } = useApp();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (!email || !password) {
      toast.error("Email dan kata sandi harus diisi.");
      return;
    }

    setLoading(true);
    try {
      const user = await login({ email, password });
      toast.success(`Selamat datang kembali, ${user.name.split(" ")[0]}!`);
      navigate({ name: "home" });
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      student_number: String(form.get("student_number") || "").trim(),
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
      study_program: String(form.get("study_program") || "").trim(),
      class_name: String(form.get("class_name") || "").trim(),
    };

    if (Object.values(payload).some((value) => !value)) {
      toast.error("Lengkapi seluruh data registrasi terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      await register(payload);
      toast.success("Akun berhasil dibuat! Silakan masuk.");
      setMode("login");
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const PREVIEW_PDFS = [
    { title: "Monitoring Optical Network Unit Berbasis SNMP Protocol", field: "Jaringan Komputer", rel: 91 },
    { title: "Implementasi YOLOv8 untuk Deteksi Objek Real-Time", field: "Artificial Intelligence", rel: 87 },
    { title: "Smart Home ESP32 dengan Integrasi MQTT Broker", field: "Internet of Things", rel: 79 },
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Gradient + Glass Form ────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center px-5 py-10 lg:py-8 min-h-screen">

        {/* ── Mesh gradient background ── */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(145deg, #bfdbfe 0%, #c4b5fd 40%, #a5f3fc 100%)" }} />

        {/* Orbs */}
        <div className="absolute pointer-events-none" style={{
          top: "-15%", left: "-10%",
          width: "65vw", height: "65vw", maxWidth: 560, maxHeight: 560,
          borderRadius: "50%",
          background: "#3b82f6",
          filter: "blur(100px)",
          opacity: 0.55,
        }} />
        <div className="absolute pointer-events-none" style={{
          top: "10%", left: "35%",
          width: "55vw", height: "55vw", maxWidth: 480, maxHeight: 480,
          borderRadius: "50%",
          background: "#8b5cf6",
          filter: "blur(110px)",
          opacity: 0.5,
        }} />
        <div className="absolute pointer-events-none" style={{
          bottom: "-10%", right: "-10%",
          width: "50vw", height: "50vw", maxWidth: 440, maxHeight: 440,
          borderRadius: "50%",
          background: "#6366f1",
          filter: "blur(100px)",
          opacity: 0.5,
        }} />
        <div className="absolute pointer-events-none" style={{
          bottom: "15%", left: "5%",
          width: "35vw", height: "35vw", maxWidth: 320, maxHeight: 320,
          borderRadius: "50%",
          background: "#22d3ee",
          filter: "blur(90px)",
          opacity: 0.35,
        }} />
        <div className="absolute pointer-events-none" style={{
          top: "40%", right: "5%",
          width: "30vw", height: "30vw", maxWidth: 280, maxHeight: 280,
          borderRadius: "50%",
          background: "#a78bfa",
          filter: "blur(80px)",
          opacity: 0.4,
        }} />

        {/* Content */}
        <div className="relative z-10 w-full max-w-[420px] flex flex-col gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
              <BookOpen className="w-4.5 h-4.5 text-indigo-600" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-[1.25rem] tracking-tight" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.12)" }}>
              Litera
            </span>
          </div>

          {/* Glass form card */}
          <div
            className="rounded-3xl p-7 flex flex-col gap-5"
            style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            {/* Tab switcher */}
            <div
              className="flex rounded-2xl p-1"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                    mode === m
                      ? "bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  {m === "login" ? "Masuk" : "Daftar"}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-white font-bold text-[1.1875rem] tracking-tight leading-snug">
                {mode === "login" ? "Selamat datang kembali" : "Buat akun mahasiswa"}
              </h2>
              <p className="text-white/55 text-[0.8125rem] mt-1">
                {mode === "login"
                  ? "Masuk untuk melanjutkan penelitianmu"
                  : "Bergabung dan mulai koleksi literaturmu"}
              </p>
            </div>

            {/* ── LOGIN FORM ── */}
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <GlassInput
                  label="Alamat Email"
                  name="email"
                  type="email"
                  placeholder="nama@mahasiswa.ac.id"
                  icon={<Mail className="w-4 h-4" />}
                  defaultValue="arif@mahasiswa.ac.id"
                  required
                />
                <GlassInput
                  label="Kata Sandi"
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Kata sandi kamu"
                  icon={<Lock className="w-4 h-4" />}
                  defaultValue="StudentDemo123!"
                  required
                  trailingIcon={
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-white/40 hover:text-white/70 transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded accent-white" />
                    <span className="text-[0.8125rem] text-white/60 group-hover:text-white/80 transition-colors">Ingat saya</span>
                  </label>
                  <button type="button" className="text-[0.8125rem] font-semibold text-white/70 hover:text-white transition-colors">
                    Lupa kata sandi?
                  </button>
                </div>

                {/* CTA button — white pill like the reference */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-white text-indigo-600 font-bold text-sm py-3.5 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.14)] hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Masuk ke Litera
                </button>

                <p className="text-center text-[0.8125rem] text-white/55">
                  Belum punya akun?{" "}
                  <button type="button" onClick={() => setMode("register")} className="font-bold text-white/90 hover:text-white underline underline-offset-2 transition-colors">
                    Daftar sekarang
                  </button>
                </p>

                {/* Demo hint */}
                <div className="rounded-xl px-3.5 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <p className="text-[11px] text-white/50 font-medium">
                    Demo: klik <strong className="text-white/70">Masuk ke Litera</strong> dengan data yang sudah terisi
                    {" "}atau gunakan admin@litera.ac.id / AdminDemo123!
                  </p>
                </div>
              </form>

            ) : (
              /* ── REGISTER FORM ── */
              <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
                <LightInput
                  label="Nama Lengkap"
                  name="name"
                  placeholder="Nama lengkap kamu"
                  icon={<User className="w-4 h-4" />}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <LightInput label="NIM" name="student_number" placeholder="2021001234" icon={<Hash className="w-4 h-4" />} required />
                  <LightInput label="Kelas" name="class_name" placeholder="TI-4A" icon={<Users className="w-4 h-4" />} required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-white/60 uppercase tracking-[0.1em]">Program Studi</label>
                  <select
                    name="study_program"
                    className="w-full px-4 py-2.5 bg-white/15 border border-white/25 rounded-xl text-sm text-white focus:outline-none focus:bg-white/22 focus:border-white/50 transition-all appearance-none"
                    style={{ colorScheme: "dark" }}
                  >
                    {["Teknik Informatika", "Sistem Informasi", "Teknik Komputer", "Ilmu Komputer"].map((p) => (
                      <option key={p} className="text-slate-900 bg-white">{p}</option>
                    ))}
                  </select>
                </div>

                <LightInput label="Alamat Email" name="email" type="email" placeholder="nama@mahasiswa.ac.id" icon={<Mail className="w-4 h-4" />} required />
                <LightInput label="Kata Sandi" name="password" type="password" placeholder="Minimal 8 karakter" icon={<Lock className="w-4 h-4" />} required hint="Huruf, angka, dan simbol" />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-white text-indigo-600 font-bold text-sm py-3.5 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.14)] hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}
                  Buat Akun Mahasiswa
                </button>

                <p className="text-center text-[0.8125rem] text-white/55">
                  Sudah punya akun?{" "}
                  <button type="button" onClick={() => setMode("login")} className="font-bold text-white/90 hover:text-white underline underline-offset-2 transition-colors">
                    Masuk di sini
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Feature badges below card */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: Shield, label: "Aman & Terenkripsi" },
              { icon: Search, label: "TF-IDF Ranking" },
              { icon: Layers, label: "1.248 Literatur" },
            ].map(({ icon: Icon, label }) => (
              <div key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/70"
                style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: White brand showcase (desktop only) ──────────────────── */}
      <div className="hidden lg:flex w-[420px] xl:w-[460px] shrink-0 bg-white flex-col justify-between py-12 px-10 xl:px-12 border-l border-[rgba(12,13,26,0.06)]">

        {/* Top: Logo + tagline */}
        <div>
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-300/40">
              <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#0C0D1A] text-base tracking-tight">Litera</span>
            <span className="ml-auto text-[10px] font-bold text-slate-300 uppercase tracking-widest">v2.0</span>
          </div>

          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.12em] mb-3">Platform Literatur Akademik</p>
          <h2 className="text-[#0C0D1A] tracking-tight mb-3" style={{ fontSize: "1.625rem", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.025em" }}>
            Satu tempat untuk semua{" "}
            <span className="font-display-italic text-indigo-600">referensi</span>
            {" "}akademikmu.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Cari, simpan, dan kelola literatur ilmiah dari koleksi mahasiswa — lebih cepat, terstruktur, dan mudah ditemukan kembali.
          </p>
        </div>

        {/* Middle: PDF preview cards */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1">Literatur Terbaru</p>
          {PREVIEW_PDFS.map((pdf, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3.5 rounded-2xl border border-[rgba(12,13,26,0.07)] bg-[#FAFAF8] hover:bg-white hover:border-[rgba(12,13,26,0.12)] hover:shadow-[0_2px_8px_rgba(12,13,26,0.06)] transition-all duration-150 group"
            >
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-red-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.8125rem] font-semibold text-[#0C0D1A] line-clamp-2 break-words leading-snug group-hover:text-indigo-700 transition-colors">{pdf.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-semibold bg-indigo-100/80 text-indigo-600 px-2 py-0.5 rounded-full">{pdf.field}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full" style={{ width: `${pdf.rel}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">{pdf.rel}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: "1.248", lbl: "Literatur PDF", color: "text-indigo-600", bg: "bg-indigo-50" },
            { val: "186", lbl: "Koleksi Aktif", color: "text-emerald-600", bg: "bg-emerald-50" },
            { val: "8", lbl: "Bidang Ilmu", color: "text-violet-600", bg: "bg-violet-50" },
            { val: "74", lbl: "Kontributor", color: "text-sky-600", bg: "bg-sky-50" },
          ].map(({ val, lbl, color, bg }) => (
            <div key={lbl} className={cn("rounded-2xl p-4", bg)}>
              <p className={cn("text-2xl font-bold tracking-tight leading-none", color)}>{val}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1.5">{lbl}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
