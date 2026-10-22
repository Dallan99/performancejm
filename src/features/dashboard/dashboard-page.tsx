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
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LATEST_DATE,
  dates,
  getImportedDataset,
  getImportedDatasets,
  latestAvailableDate,
  registerImportedDataset,
  removeImportedDataset,
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
  type BaseRow,
  type SupervisorName,
  type DailyDataset,
  supervisorGroups,
  baseCode,
  isBaseForSupervisor,
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
  const [supervisorName, setSupervisorName] = useState<SupervisorName | "">("");
  const [metric, setMetric] = useState<Metric>("logistics");
  const [modal, setModal] = useState(false);
  const [importHistory, setImportHistory] = useState(getImportedDatasets);
  const [pendingDelete, setPendingDelete] = useState<DailyDataset | null>(null);
  const activePeriod = view === "overview" ? "day" : period;
  const importedDataset = getImportedDataset(date);
  const activeSupervisor = view === "overview"
    ? supervisorGroups.find((group) => group.name === supervisorName)
    : undefined;
  useEffect(() => {
    const syncLatest = (event: Event) => {
      const importedDate = (event as CustomEvent<string>).detail;
      setImportHistory(getImportedDatasets());
      if (importedDate) setDate(importedDate);
    };
    const syncRemoved = (event: Event) => {
      const { date: removedDate, latestDate } = (event as CustomEvent<{ date: string; latestDate: string }>).detail;
      setImportHistory(getImportedDatasets());
      if (date === removedDate) setDate(latestDate);
    };
    window.addEventListener("dashboard:dataset-imported", syncLatest);
    window.addEventListener("dashboard:dataset-removed", syncRemoved);
    return () => {
      window.removeEventListener("dashboard:dataset-imported", syncLatest);
      window.removeEventListener("dashboard:dataset-removed", syncRemoved);
    };
  }, [date]);
  const all = rowsForDate(date);
  const matchingRows = (source: BaseRow[]) =>
    source.filter(
      (row) =>
        (!activeSupervisor || isBaseForSupervisor(row.base, activeSupervisor.name)) &&
        (!base || row.base === base),
    );
  const baseOptions = activeSupervisor
    ? all.filter((row) => isBaseForSupervisor(row.base, activeSupervisor.name))
    : all;
  const selectedDates =
    activePeriod === "day"
      ? [date]
      : dates.slice(dates.indexOf(date), dates.indexOf(date) + (activePeriod === "week" ? 7 : 14));
  const rows = matchingRows(all)
    .map((r) => {
      if (activePeriod === "day") return r;
      const group = selectedDates.flatMap((d) => matchingRows(rowsForDate(d)).filter((b) => b.base === r.base));
      return { ...r, ...aggregate(group) };
    });
  const totals =
    importedDataset && activePeriod === "day" && !base && !activeSupervisor
      ? importedDataset.consolidated
      : aggregate(rows);
  const tone = performanceTone(totals[metric], totals.packages > 0);
  const trends = [...dates]
    .reverse()
    .filter((d) => d <= date)
    .map((d) => ({
      date: d,
      value: getImportedDataset(d) && !base && !activeSupervisor
        ? getImportedDataset(d)!.consolidated[metric]
        : aggregate(matchingRows(rowsForDate(d)))[metric],
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
    matchingRows(rowsForDate(dates[Math.min(dates.indexOf(date) + 1, dates.length - 1)])),
  );
  const supervisorSummaries = supervisorGroups.map((group) => {
    const groupRows = all.filter((row) => isBaseForSupervisor(row.base, group.name));
    const representedBases = group.baseLabels.filter((label) => {
      const codes = label.match(/(?:SSP|ESP|SSC)[ ]*0*[0-9]+/gi)?.map(baseCode) ?? [];
      return groupRows.some((row) => codes.includes(baseCode(row.base)));
    });
    return { ...group, rows: groupRows, representedBases, totals: aggregate(groupRows) };
  });
  return (
    <>
      <div className={`page-heading ${view === "overview" ? "overview-heading" : ""}`}>
        <div>
          <div className="page-eyebrow">PERFORMANCE LAST MILE</div>
          <h1>{view === "overview" ? "Painel de Performance" : titles[view]}</h1>
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
          <section className={`filter-band ${view === "overview" ? "overview-filters" : ""}`}>
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
            {view !== "overview" && (
              <div className="filter-field">
                <label htmlFor="period">Período</label>
                <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  <option value="day">Diário</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="fortnight">Últimos 14 dias</option>
                </select>
              </div>
            )}
            <div className="filter-field base-filter">
              <label htmlFor="base">Base operacional</label>
              <select id="base" value={base} onChange={(e) => setBase(e.target.value)}>
                <option value="">Todas as bases</option>
                {baseOptions.map((r) => (
                  <option key={r.base}>{r.base}</option>
                ))}
              </select>
            </div>
            {view !== "overview" && (
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
            )}
            <Button
              variant="outline"
              className="reset-filters"
              title="Limpar filtros"
              aria-label="Limpar filtros"
              onClick={() => {
                setBase("");
                setSupervisorName("");
                setDate(latestAvailableDate());
                setPeriod("day");
                setMetric("logistics");
              }}
            >
              <RotateCw size={16} />
            </Button>
          </section>
          <div className={`results-line ${view === "overview" ? "overview-results" : ""}`}>
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
          <section className="supervisor-board" aria-label="Filtros de supervisor">
            <div className="supervisor-board-heading">
              <div>
                <h2>Visão por supervisor</h2>
                <p>Selecione para ver as bases e o consolidado da equipe.</p>
              </div>
              {activeSupervisor && (
                <Button variant="outline" size="sm" onClick={() => { setSupervisorName(""); setBase(""); }}>
                  Todas as bases
                </Button>
              )}
            </div>
            <div className="supervisor-cards">
              {supervisorSummaries.map((group) => {
                const groupTone = performanceTone(group.totals.logistics, group.totals.packages > 0);
                return (
                  <button
                    type="button"
                    key={group.name}
                    className={`supervisor-card ${supervisorName === group.name ? "is-selected" : ""}`}
                    aria-pressed={supervisorName === group.name}
                    onClick={() => {
                      setSupervisorName(supervisorName === group.name ? "" : group.name);
                      setBase("");
                    }}
                  >
                    <span className="supervisor-card-top">
                      <strong>{group.name}</strong>
                      <span>{group.baseLabels.length} bases · {group.representedBases.length} no dia</span>
                    </span>
                    <span className={`supervisor-card-performance tone-text-${groupTone}`}>
                      {percent(group.totals.logistics)}
                      <small>DS geral da equipe</small>
                    </span>
                    <span className="supervisor-card-bases">{group.baseLabels.join(" · ")}</span>
                  </button>
                );
              })}
            </div>
          </section>
          <div className="supervisor-summary-title">
            <strong>{activeSupervisor ? `DS geral — ${activeSupervisor.name}` : "DS geral — todas as bases"}</strong>
            <span>{rows.length} bases no resumo · Meta 98,20%</span>
          </div>
          <section className="kpi-grid overview-kpi-grid">
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
              const change = activePeriod === "day" && prev ? ((c.value - prev) / prev) * 100 : null;
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
                    <th>Ações</th>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={"Excluir importação " + d.filename}
                          title="Excluir esta importação"
                          onClick={() => setPendingDelete(d)}
                        >
                          <Trash2 className="text-danger" />
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
          <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir esta planilha importada?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação remove somente os dados desta sessão do navegador e não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {pendingDelete && (
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p><strong>Arquivo:</strong> {pendingDelete.filename}</p>
                  <p><strong>Data operacional:</strong> {shortDate(pendingDelete.date)}</p>
                  <p><strong>Bases afetadas:</strong> {pendingDelete.rows.length}</p>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (pendingDelete) removeImportedDataset(pendingDelete.date);
                    setPendingDelete(null);
                  }}
                >
                  Excluir importação
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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


