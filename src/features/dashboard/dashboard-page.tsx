import { useEffect, useState } from "react";
import {
  Truck,
  Package,
  PackageCheck,
  PackageX,
  ShieldAlert,
  RotateCcw,
  FileWarning,
  TrendingUp,
  CalendarDays,
  SlidersHorizontal,
  RotateCw,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  MapPin,
  FolderUp,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Upload,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LATEST_DATE,
  dates,
  getImportedDataset,
  getImportedDatasets,
  latestAvailableDate,
  registerImportedDataset,
  rowsForDate,
  aggregate,
  metricNames,
  performanceTone,
  percent,
  number,
  shortDate,
  toneLabels,
  exportCsv,
  type Metric,
  type DailyDataset,
} from "./data";
import { EvolutionChart, RankingChart } from "./charts";
import { PerformanceTable } from "./performance-table";
import { ImportModal } from "./import-modal";
export type View = "overview" | "history" | "bases" | "imports";
const titles = {
  overview: "Visão Geral",
  history: "Histórico",
  bases: "Análise por Base",
  imports: "Importações",
};
export function DashboardPage({ view, initialBase = "" }: { view: View; initialBase?: string }) {
  const [date, setDate] = useState(latestAvailableDate);
  const [period, setPeriod] = useState("day");
  const [base, setBase] = useState(initialBase);
  const [metric, setMetric] = useState<Metric>("logistics");
  const [modal, setModal] = useState(false);
  const importedDataset = getImportedDataset(date);
  const importHistory = getImportedDatasets();
  useEffect(() => {
    const syncLatest = (event: Event) => {
      const importedDate = (event as CustomEvent<string>).detail;
      if (importedDate) setDate(importedDate);
    };
    window.addEventListener("dashboard:dataset-imported", syncLatest);
    return () => window.removeEventListener("dashboard:dataset-imported", syncLatest);
  }, []);
  const all = rowsForDate(date);
  const selectedDates =
    period === "day"
      ? [date]
      : dates.slice(dates.indexOf(date), dates.indexOf(date) + (period === "week" ? 7 : 14));
  const rows = all
    .filter((r) => !base || r.base === base)
    .map((r) => {
      if (period === "day") return r;
      const group = selectedDates.flatMap((d) => rowsForDate(d).filter((b) => b.base === r.base));
      return { ...r, ...aggregate(group) };
    });
  const totals =
    importedDataset && period === "day" && !base
      ? importedDataset.consolidated
      : aggregate(rows);
  const tone = performanceTone(totals[metric], totals.packages > 0);
  const trends = [...dates]
    .reverse()
    .filter((d) => d <= date)
    .map((d) => ({
      date: d,
      value: getImportedDataset(d) && !base
        ? getImportedDataset(d)!.consolidated[metric]
        : aggregate(rowsForDate(d).filter((r) => !base || r.base === base))[metric],
    }));
  const counts = { success: 0, warning: 0, danger: 0, neutral: 0 };
  rows.forEach((r) => counts[performanceTone(r[metric], r.packages > 0)]++);
  const cards = [
    {
      label: "Veículos",
      value: totals.vehicles,
      icon: Truck,
      change: "+4,2%",
      up: true,
      style: "primary",
    },
    {
      label: "Pacotes",
      value: totals.packages,
      icon: Package,
      change: "+6,8%",
      up: true,
      style: "primary",
    },
    {
      label: "Entregas",
      value: totals.deliveries,
      icon: PackageCheck,
      change: "+7,1%",
      up: true,
      style: "success",
    },
    {
      label: "DC Cancelado",
      value: totals.dc,
      icon: PackageX,
      change: "−12,4%",
      up: false,
      style: "muted",
    },
    {
      label: "Sinistros",
      value: totals.claims,
      icon: ShieldAlert,
      change: "−8,3%",
      up: false,
      style: "danger",
    },
    {
      label: "Insucessos",
      value: totals.failures,
      icon: RotateCcw,
      change: "−5,6%",
      up: false,
      style: "warning",
    },
    {
      label: "PNR",
      value: totals.pnr,
      icon: FileWarning,
      change: "−9,2%",
      up: false,
      style: "warning",
    },
  ];
  const previous = aggregate(
    rowsForDate(dates[Math.min(dates.indexOf(date) + 1, dates.length - 1)]).filter(
      (r) => !base || r.base === base,
    ),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">PERFORMANCE LAST MILE</div>
          <h1>{titles[view]}</h1>
          <p>
            {view === "overview"
              ? "Uma visão consolidada da sua operação, em um só lugar."
              : view === "history"
                ? "Acompanhe o desempenho e compare os resultados ao longo do tempo."
                : view === "bases"
                  ? "Do consolidado ao detalhe de cada base operacional."
                  : "Central de arquivos e acompanhamento das importações diárias."}
          </p>
        </div>
        <div className="operational-date">
          <span className="date-icon">
            <CalendarDays size={20} />
          </span>
          <div>
            <span>Última data operacional</span>
            <strong>
              {shortDate(latestAvailableDate())}
              <span className="latest-badge">Mais recente</span>
            </strong>
          </div>
        </div>
      </div>
      {view !== "imports" && (
        <>
          <section className="filter-band">
            <div className="filter-field date-filter">
              <label htmlFor="op-date">
                <CalendarDays size={13} />
                Data operacional
              </label>
              <input
                id="op-date"
                type="date"
                min={dates.at(-1)}
                max={dates[0] ?? LATEST_DATE}
                value={date}
                onChange={(e) => {
                  if (dates.includes(e.target.value)) setDate(e.target.value);
                }}
              />
            </div>
            <div className="filter-field">
              <label htmlFor="period">Período</label>
              <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="day">Diário</option>
                <option value="week">Últimos 7 dias</option>
                <option value="fortnight">Últimos 14 dias</option>
              </select>
            </div>
            <div className="filter-field base-filter">
              <label htmlFor="base">Base operacional</label>
              <select id="base" value={base} onChange={(e) => setBase(e.target.value)}>
                <option value="">Todas as bases</option>
                {all.map((r) => (
                  <option key={r.base}>{r.base}</option>
                ))}
              </select>
            </div>
            <div className="filter-field indicator-filter">
              <label htmlFor="indicator">Indicador de performance</label>
              <select
                id="indicator"
                value={metric}
                onChange={(e) => setMetric(e.target.value as Metric)}
              >
                {Object.entries(metricNames).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              className="reset-filters"
              title="Limpar filtros"
              aria-label="Limpar filtros"
              onClick={() => {
                setBase("");
                setDate(latestAvailableDate());
                setPeriod("day");
                setMetric("logistics");
              }}
            >
              <RotateCw size={16} />
            </Button>
          </section>
          <div className="results-line">
            <span>
              <span className="live-dot" />
              Operação de <strong>{shortDate(date)}</strong>
              <span className="results-divider">|</span>
              <strong>{rows.length}</strong> bases {base ? "selecionada" : "ativas"}
            </span>
            <span>
              {importedDataset
                ? "Arquivo importado nesta sessão: " + importedDataset.filename
                : "Demonstração"}
            </span>
          </div>
        </>
      )}
      {view === "overview" && (
        <>
          <section className="kpi-grid">
            {cards.map((c) => {
              const key = {
                Veículos: "vehicles",
                Pacotes: "packages",
                Entregas: "deliveries",
                "DC Cancelado": "dc",
                Sinistros: "claims",
                Insucessos: "failures",
                PNR: "pnr",
              }[c.label] as keyof typeof previous;
              const prev = Number(previous[key]);
              const change = period === "day" && prev ? ((c.value - prev) / prev) * 100 : null;
              return (
                <article className="kpi-card" key={c.label}>
                  <div className="kpi-label">
                    <span>{c.label}</span>
                    <span className={`kpi-icon icon-${c.style}`}>
                      <c.icon size={17} />
                    </span>
                  </div>
                  <strong className="kpi-value">{number(c.value)}</strong>
                  <div className="kpi-change">
                    {change !== null ? (
                      <>
                        <span
                          className={
                            (
                              c.label === "Veículos" ||
                              c.label === "Pacotes" ||
                              c.label === "Entregas"
                                ? change >= 0
                                : change <= 0
                            )
                              ? "text-success"
                              : "text-danger"
                          }
                        >
                          {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{" "}
                          {Math.abs(change).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                        </span>
                        <small>vs. dia anterior</small>
                      </>
                    ) : (
                      <small>Total no período</small>
                    )}
                  </div>
                </article>
              );
            })}
            <article className={`kpi-card performance-kpi tone-border-${tone}`}>
              <div className="kpi-label">
                <span>Performance</span>
                <span className={`kpi-icon icon-${tone}`}>
                  <TrendingUp size={17} />
                </span>
              </div>
              <strong className={`kpi-value tone-text-${tone}`}>{percent(totals[metric])}</strong>
              <div className={`performance-state tone-text-${tone}`}>
                <span />
                {toneLabels[tone]}
                <small>Meta 98,20%</small>
              </div>
            </article>
          </section>
          <div className="status-strip">
            <div className="status-strip-title">
              <span className="status-symbol">
                <SlidersHorizontal size={15} />
              </span>
              <strong>Saúde da operação</strong>
            </div>
            <span>
              <i className="tone-bg-success" />
              {counts.success} dentro da meta
            </span>
            <span>
              <i className="tone-bg-warning" />
              {counts.warning} em atenção
            </span>
            <span>
              <i className="tone-bg-danger" />
              {counts.danger} críticas
            </span>
            <span className="neutral-status">
              <i className="tone-bg-neutral" />
              {counts.neutral} sem dados
            </span>
            <span className="status-meta">
              Meta oficial: <strong>98,20%</strong>
            </span>
          </div>
          <div className="charts-grid">
            <EvolutionChart points={trends} />
            <RankingChart rows={rows} metric={metric} />
          </div>
          <PerformanceTable rows={rows} date={date} importedDataset={importedDataset} />
        </>
      )}
      {view === "history" && (
        <>
          <div className="history-summary">
            <div>
              <span>Performance no período</span>
              <strong className={`tone-text-${tone}`}>{percent(totals[metric])}</strong>
            </div>
            <div>
              <span>Pacotes processados</span>
              <strong>{number(totals.packages)}</strong>
            </div>
            <div>
              <span>Entregas realizadas</span>
              <strong>{number(totals.deliveries)}</strong>
            </div>
            <div>
              <span>Meta operacional</span>
              <strong>98,20%</strong>
            </div>
          </div>
          <EvolutionChart points={trends} />
          <section className="table-section mt-6">
            <div className="section-heading">
              <div>
                <h2>Resultados por data</h2>
                <p>
                  {metricNames[metric]} · {base || "Todas as bases"}
                </p>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table history-table">
                <thead>
                  <tr>
                    <th>Data operacional</th>
                    <th>Bases ativas</th>
                    <th>Veículos</th>
                    <th>Pacotes</th>
                    <th>Entregas</th>
                    <th>{metricNames[metric]}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dates
                    .filter((d) => d <= date)
                    .map((d) => {
                      const list = rowsForDate(d).filter((r) => !base || r.base === base);
                      const a = getImportedDataset(d) && !base
                        ? getImportedDataset(d)!.consolidated
                        : aggregate(list);
                      const t = performanceTone(a[metric], a.packages > 0);
                      return (
                        <tr key={d}>
                          <td>{shortDate(d)}</td>
                          <td>{list.length}</td>
                          <td>{number(a.vehicles)}</td>
                          <td>{number(a.packages)}</td>
                          <td>{number(a.deliveries)}</td>
                          <td>
                            <span className={`performance-chip tone-${t}`}>
                              {percent(a[metric])}
                            </span>
                          </td>
                          <td className={`tone-text-${t}`}>{toneLabels[t]}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {view === "bases" && (
        <>
          <div className="base-analysis-grid">
            {rows.map((r) => (
              <article className="base-analysis-card" key={r.base}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="operation-badge">{r.type}</span>
                    <h2>{r.base}</h2>
                  </div>
                  <MapPin size={19} className="text-muted-foreground" />
                </div>
                <div className="base-volume">
                  <span>
                    <Package size={14} />
                    {number(r.packages)} pacotes
                  </span>
                  <span>
                    <Truck size={14} />
                    {r.vehicles} veículos
                  </span>
                </div>
                <div className="base-performances">
                  {Object.entries(metricNames).map(([k, label]) => {
                    const value = r[k as Metric];
                    const t = performanceTone(value, r.packages > 0);
                    return (
                      <div key={k}>
                        <span>{label}</span>
                        <strong className={`tone-text-${t}`}>{percent(value)}</strong>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between mt-3"
                  onClick={() => setBase(base === r.base ? "" : r.base)}
                >
                  {base ? "Ver todas as bases" : "Selecionar base"}
                  <ArrowRight />
                </Button>
              </article>
            ))}
          </div>
          <div className="charts-grid mt-6">
            <EvolutionChart points={trends} />
            <RankingChart rows={rows} metric={metric} />
          </div>
          <PerformanceTable rows={rows} date={date} importedDataset={importedDataset} />
        </>
      )}
      {view === "imports" && (
        <>
          <section className="imports-banner">
            <div className="imports-banner-icon">
              <FolderUp size={30} />
            </div>
            <div>
              <h2>Planilhas operacionais</h2>
              <p>Planilha diária Excel ou CSV com as 12 colunas da operação.</p>
              <span>Importações disponíveis somente nesta sessão do navegador.</span>
            </div>
            <Button onClick={() => setModal(true)}>
              <Upload />
              Importar Planilha
            </Button>
          </section>
          <div className="import-stats">
            <div>
              <FileSpreadsheet />
              <span>
                Arquivos nesta sessão<strong>{importHistory.length}</strong>
              </span>
            </div>
            <div>
              <CheckCircle2 className="text-success" />
              <span>
                Validados nesta sessão<strong>{importHistory.length}</strong>
              </span>
            </div>
            <div>
              <MapPin />
              <span>
                Bases no arquivo mais recente<strong>{importHistory[0]?.rows.length ?? 0}</strong>
              </span>
            </div>
          </div>
          <section className="table-section">
            <div className="section-heading">
              <div>
                <h2>Histórico de importações</h2>
                <p>Arquivos importados nesta sessão ativa do navegador</p>
              </div>
              <span className="demo-badge">Temporário</span>
            </div>
            <div className="table-scroll">
              <table className="data-table imports-table">
                <thead>
                  <tr>
                    <th>Arquivo</th>
                    <th>Data operacional</th>
                    <th>Registros</th>
                    <th>Status</th>
                    <th>Responsável</th>
                    <th>Modelo</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map((d) => (
                    <tr key={d.date}>
                      <td>
                        <span className="file-cell">
                          <FileSpreadsheet size={20} />
                          <strong>{d.filename}</strong>
                        </span>
                      </td>
                      <td>{shortDate(d.date)}</td>
                      <td>{d.rows.length} bases</td>
                      <td>
                        <span className="performance-chip tone-success">
                          <CheckCircle2 size={13} />
                          Nesta sessão
                        </span>
                      </td>
                      <td>Importação local</td>
                      <td>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={"Baixar CSV de " + shortDate(d.date)}
                          onClick={() => exportCsv(d.rows)}
                        >
                          <Download />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!importHistory.length && (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhuma planilha importada nesta sessão.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <div className="imports-notice">
            <Info size={16} />
            As importações ficam somente na memória desta sessão do navegador e desaparecem quando
            ela termina. Nenhum arquivo ou indicador foi salvo em banco de dados.
          </div>
        </>
      )}
      <ImportModal
        open={modal}
        onOpenChange={setModal}
        onImport={(dataset: DailyDataset, replace: boolean) => {
          registerImportedDataset(dataset, replace);
          setDate(latestAvailableDate());
          setBase("");
          setPeriod("day");
        }}
      />
    </>
  );
}

