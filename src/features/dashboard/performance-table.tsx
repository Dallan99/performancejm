import { useMemo, useState } from "react";
import { ArrowDownUp, Search, Download, RotateCcw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { columns, number, percent, performanceTone, exportCsv, type BaseRow, type DailyDataset } from "./data";
import { OFFICIAL_HEADERS } from "./workbook";

type SortKey = keyof BaseRow | "date";
const officialFields: SortKey[] = ["date", "base", "vehicles", "packages", "deliveries", "dc", "claims", "failures", "pnr", "logistics", "withoutDc", "withoutClaims"];

export function PerformanceTable({ rows, title = "Performance por base", date, importedDataset }: {
  rows: BaseRow[];
  title?: string;
  date?: string;
  importedDataset?: DailyDataset | null;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey | null>(null);
  const [ascending, setAscending] = useState(true);
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => {
    const result = rows.filter((row) =>
      row.base.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
      (status === "all" || performanceTone(row.logistics, row.packages > 0) === status),
    );
    if (sort) {
      result.sort((a, b) => {
        const left = sort === "date" ? a.date ?? date ?? "" : a[sort];
        const right = sort === "date" ? b.date ?? date ?? "" : b[sort];
        const compared = typeof left === "string" && typeof right === "string"
          ? left.localeCompare(right)
          : Number(left ?? -1) - Number(right ?? -1);
        return compared * (ascending ? 1 : -1);
      });
    }
    return result;
  }, [rows, query, status, sort, ascending, date]);
  const imported = Boolean(importedDataset);
  const headers = imported ? OFFICIAL_HEADERS : columns.map((column) => column.label);
  const fields = imported ? officialFields : columns.map((column) => column.key as SortKey);
  const rowsForExport = filtered;
  const dateText = date ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR") : "—";

  function sortBy(field: SortKey) {
    if (sort === field) setAscending((current) => !current);
    else { setSort(field); setAscending(true); }
  }

  function cell(row: BaseRow, field: SortKey, rowDate = dateText) {
    if (field === "date") {
      if (importedDataset) {
        const sourceRow = importedDataset.sourceRows?.find((source) => source[1] === row.base);
        return sourceRow?.[0]?.trim() ?? "";
      }
      return rowDate;
    }
    if (field === "base") {
      if (row.base === "Consolidado") return <strong>{row.base}</strong>;
      if (imported) return <span>{row.base}</span>;
      return (
        <Link to="/bases" search={{ base: row.base }} className="base-cell">
          <span className="base-code">{row.base.split(" ")[0]}</span>
          <span>{row.base.substring(row.base.indexOf(" ") + 1)}</span>
        </Link>
      );
    }
    if (field === "type") return <span className={"operation-badge " + (row.type === "XPT" ? "xpt" : "")}>{row.type}</span>;
    if (field === "vehicles" || field === "packages" || field === "deliveries" || field === "dc" || field === "claims" || field === "failures" || field === "pnr") {
      return number(row[field]);
    }
    const value = row[field];
    const tone = performanceTone(value, row.packages > 0);
    return <span className={"performance-chip tone-" + tone}><span />{percent(value)}</span>;
  }

  return (
    <section className="table-section">
      <div className="section-heading">
        <div>
          <h2>{title}<span className="count-badge">{rows.length} bases</span></h2>
          <p>{imported ? "Colunas e ordem física preservadas da planilha" : "Detalhamento dos indicadores da operação"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportCsv(rowsForExport)}><Download /> Exportar CSV</Button>
      </div>
      <div className="table-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input aria-label="Buscar base na tabela" placeholder="Buscar base ou código..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select className="compact-select" aria-label="Filtrar status da tabela" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Todos os status</option>
          <option value="success">Dentro da meta</option>
          <option value="warning">Atenção</option>
          <option value="danger">Crítico</option>
          <option value="neutral">Sem dados</option>
        </select>
        {sort ? (
          <Button variant="ghost" size="sm" onClick={() => setSort(null)}><RotateCcw size={14} /> Restaurar ordem original</Button>
        ) : <span className="table-scroll-hint">{headers.length} colunas <ArrowDownUp size={13} /></span>}
      </div>
      <div className="table-scroll">
        <table className={`data-table performance-table ${imported ? "imported-performance-table" : ""}`}>
          <thead><tr>{headers.map((header, index) => {
            const field = fields[index];
            return <th key={header} aria-sort={sort === field ? ascending ? "ascending" : "descending" : "none"}>
              <Button variant="ghost" onClick={() => sortBy(field)} className="table-sort">
                {header}<ArrowDownUp className={sort === field ? "text-primary" : "text-muted-foreground"} />
              </Button>
            </th>;
          })}</tr></thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.base}>{fields.map((field) => <td key={field}>{cell(row, field)}</td>)}</tr>
            ))}
            {!filtered.length && <tr><td colSpan={headers.length} className="text-center py-10 text-muted-foreground">Nenhuma base encontrada para os filtros.</td></tr>}
          </tbody>
          {importedDataset && (
            <tfoot className="consolidated-row">
              <tr>{fields.map((field) => <td key={field}>{cell(importedDataset.consolidated, field, dateText)}</td>)}</tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="table-pagination">
        <span>Exibindo {filtered.length} de {rows.length} bases · Consolidado oficial no rodapé</span>
      </div>
    </section>
  );
}

