import { useState } from "react";
import { BookOpen, Search, Bell, ChevronDown, Upload, Menu, X, LayoutDashboard, Shield, LogOut, Home, Compass, FolderOpen, Info } from "lucide-react";
import { useApp } from "../context";
import { useAuth } from "../../contexts/AuthContext";
import { Button, Avatar, cn } from "./ui";

function getInitials(name?: string) {
  if (!name) return "LT";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LT";
}

export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const { navigate, setShowUploadModal } = useApp();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const links = [
    { label: "Beranda", icon: Home, page: "home" as const },
    { label: "Jelajahi Bidang", icon: Compass, page: "fields" as const },
    { label: "Koleksi", icon: FolderOpen, page: "fields" as const },
    { label: "Tentang", icon: Info, page: "home" as const },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate({ name: "search", query, sortBy: "relevance", page: 1 });
      setSearchOpen(false);
    }
  }

  function handleLogout() {
    logout();
    setAvatarOpen(false);
    setMobileOpen(false);
    navigate({ name: "login" });
  }

  const firstName = user?.name.split(" ")[0] || "Pengguna";
  const initials = getInitials(user?.name);

  return (
    <nav className={cn(
      "sticky top-0 z-50 border-b transition-all duration-200",
      transparent
        ? "bg-transparent border-transparent"
        : "bg-white/95 backdrop-blur-xl border-[rgba(12,13,26,0.07)] shadow-[0_1px_0_rgba(12,13,26,0.06)]"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-[60px] gap-3">

          {/* Logo */}
          <button onClick={() => navigate({ name: "home" })} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-[10px] flex items-center justify-center shadow-sm shadow-indigo-300/50 group-hover:bg-indigo-700 transition-colors">
              <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[#0C0D1A] font-bold text-[17px] tracking-[-0.02em]">Litera</span>
          </button>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-0.5 ml-3">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate({ name: link.page })}
                className="px-3.5 py-2 text-sm font-medium text-slate-500 hover:text-[#0C0D1A] hover:bg-[rgba(12,13,26,0.05)] rounded-xl transition-all"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search (desktop) */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari literatur..."
                className="w-56 px-4 py-2 bg-slate-100 border border-[rgba(12,13,26,0.1)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
          )}

          {/* Bell */}
          <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-all"
            >
              <Avatar initials={initials} color="bg-indigo-500" size="sm" />
              <span className="hidden sm:block text-sm font-semibold text-slate-700 leading-none">{firstName}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", avatarOpen && "rotate-180")} />
            </button>
            {avatarOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-[rgba(12,13,26,0.08)] shadow-xl shadow-slate-200/60 overflow-hidden z-50">
                  <div className="px-4 py-3.5 border-b border-[rgba(12,13,26,0.07)] bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-900">{user?.name || "Pengguna Litera"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{user?.email || "Belum login"}</p>
                    {user && <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{user.role}</p>}
                  </div>
                  {[
                    { label: "Dashboard Mahasiswa", icon: LayoutDashboard, action: () => navigate({ name: "dashboard" }), show: true },
                    { label: "Panel Admin", icon: Shield, action: () => navigate({ name: "admin" }), show: user?.role === "admin" },
                  ].filter((item) => item.show).map((item) => (
                    <button key={item.label} onClick={() => { item.action(); setAvatarOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-[rgba(12,13,26,0.07)]">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Upload button */}
          <div className="hidden sm:block shrink-0">
            <Button onClick={() => setShowUploadModal(true)} size="sm">
              <Upload className="w-3.5 h-3.5" strokeWidth={2.5} />
              Unggah Literatur
            </Button>
          </div>

          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[rgba(12,13,26,0.07)] py-3 flex flex-col gap-1 pb-4">
            {/* Mobile search */}
            <form onSubmit={(e) => { e.preventDefault(); const query = searchQuery.trim(); if (query) { navigate({ name: "search", query, sortBy: "relevance", page: 1 }); setMobileOpen(false); } }} className="px-1 mb-2">
              <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari literatur..." className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none" />
              </div>
            </form>
            {links.map((link) => (
              <button key={link.label} onClick={() => { navigate({ name: link.page }); setMobileOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                <link.icon className="w-4 h-4 text-slate-400" />
                {link.label}
              </button>
            ))}
            <div className="pt-2 px-1 border-t border-[rgba(12,13,26,0.07)] mt-1">
              <Button onClick={() => { setShowUploadModal(true); setMobileOpen(false); }} className="w-full" size="sm">
                <Upload className="w-3.5 h-3.5" />
                Unggah Literatur
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
