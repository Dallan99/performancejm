import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  History,
  MapPin,
  FolderUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  Upload,
  ChevronDown,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/jm-oficial.jpeg.asset.json";
import { ImportModal } from "./import-modal";
const links = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/bases", label: "Análise por Base", icon: MapPin },
  { to: "/importacoes", label: "Importações", icon: FolderUp },
] as const;
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const active = links.find((l) => l.to === path);
  return (
    <div className={`dashboard-layout ${collapsed ? "is-collapsed" : ""}`}>
      {mobile && <div className="mobile-backdrop" onClick={() => setMobile(false)} />}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link to="/" className="sidebar-brand">
          <img src={logo.url} alt="Logotipo oficial JM Transportes" />
          <div className="sidebar-label">
            <strong>JM Transportes</strong>
            <span>INTELIGÊNCIA OPERACIONAL</span>
          </div>
        </Link>
        <div className="sidebar-workspace sidebar-label">
          <span className="workspace-icon">
            <Activity size={18} />
          </span>
          <div>
            <strong>Dashboard DS</strong>
            <span>Performance Last Mile</span>
          </div>
        </div>
        <p className="nav-caption sidebar-label">PRINCIPAL</p>
        <nav>
          {links.map((l) => (
            <Button
              key={l.to}
              asChild
              variant="ghost"
              className={`nav-item ${path === l.to ? "nav-active" : ""}`}
              title={l.label}
            >
              <Link to={l.to} onClick={() => setMobile(false)}>
                <l.icon size={19} />
                <span className="sidebar-label">{l.label}</span>
                {path === l.to && <span className="nav-dot sidebar-label" />}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="target-note sidebar-label">
            <span className="target-icon">
              <Activity size={17} />
            </span>
            <strong>Uma operação. Uma meta.</strong>
            <p>Excelência em cada entrega.</p>
            <span className="target-number">
              98,20% <small>meta operacional</small>
            </span>
          </div>
          <Button
            variant="ghost"
            className="sidebar-collapse"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
            <span className="sidebar-label">Recolher menu</span>
          </Button>
          <div className="sidebar-foot sidebar-label">
            JM DASHBOARD DS <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
            <img className="header-logo" src={logo.url} alt="JM" />
            <span className="header-name">JM Dashboard DS</span>
            <span className="header-divider" />
            <span className="header-current">{active?.label}</span>
          </div>
          <div className="header-right">
            <span className="demo-badge">
              <span />
              Dados demonstrativos
            </span>
            <Button className="import-button" onClick={() => setOpen(true)}>
              <Upload />
              <span>Importar Planilha</span>
            </Button>
            <div className="user-avatar" title="Perfil demonstrativo">
              JM
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="page-footer">
          <span>© 2026 JM Transportes</span>
          <span>
            JM Dashboard DS <span className="footer-dot">·</span> Performance que move a operação.
          </span>
        </footer>
      </div>
      <ImportModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
