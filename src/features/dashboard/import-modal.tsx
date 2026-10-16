import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { findImportConflict, latestAvailableDate, number, percent, rowsForDate, exportCsv, type DailyDataset } from "./data";
import { parseOperationalFile, previewToDataset, type OperationalPreview } from "./workbook";

export function ImportModal({ open, onOpenChange, onImport }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (dataset: DailyDataset, replace: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<OperationalPreview | null>(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [replaceArmed, setReplaceArmed] = useState(false);
  const ready = preview ? previewToDataset(preview) : null;
  const conflict = ready ? findImportConflict(ready.date, ready.filename) : null;
  const sameDate = Boolean(ready && conflict?.date === ready.date);

  async function read(file?: File) {
    if (!file) return;
    setError("");
    setPreview(null);
    setReplaceArmed(false);
    setFilename(file.name);
    if (file.size > 15 * 1024 * 1024) {
      setError("O arquivo deve ter até 15 MB.");
      return;
    }
    try {
      setPreview(await parseOperationalFile(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível ler o arquivo.");
    }
  }

  function confirmImport() {
    if (!ready) return;
    if (conflict && !replaceArmed) {
      setReplaceArmed(true);
      return;
    }
    onImport(ready, sameDate);
    setPreview(null);
    setReplaceArmed(false);
    onOpenChange(false);
  }

  const display = (value: string, index: number) => {
    if (index < 9) return value || "—";
    if (!value || value === "#DIV/0!" || value.toLowerCase() === "nan") return "—";
    const raw = Number(value.replace(",", "."));
    if (!Number.isFinite(raw)) return value;
    const pct = raw >= 0 && raw <= 1 ? raw * 100 : raw;
    return pct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  };
  const dateLabel = (date: string | null) =>
    date ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR") : "Data não identificada";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>Importar planilha operacional</DialogTitle>
          <DialogDescription>
            Os arquivos ficam somente na sessão ativa do navegador; não são salvos em banco.
          </DialogDescription>
        </DialogHeader>
        <div
          onDragOver={(event) => { event.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(event) => { event.preventDefault(); setDrag(false); void read(event.dataTransfer.files[0]); }}
          className={"drop-zone " + (drag ? "drag-active" : "")}
        >
          <UploadCloud size={36} className="text-primary" />
          <strong>Arraste o arquivo Excel ou CSV até aqui</strong>
          <span className="text-sm text-muted-foreground">.xlsx ou .csv · Até 15 MB · aba PERFORMANCE</span>
          <Button variant="outline" onClick={() => input.current?.click()}>Selecionar arquivo</Button>
          <input
            ref={input}
            className="hidden"
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            aria-label="Arquivo Excel ou CSV"
            onChange={(event) => void read(event.target.files?.[0])}
          />
        </div>
        <Button variant="link" className="justify-start px-0" onClick={() => exportCsv(rowsForDate(latestAvailableDate()))}>
          <Download /> Baixar CSV demonstrativo
        </Button>
        {error && <p role="alert" className="text-danger text-sm">{error}</p>}
        {preview && (
          <>
            <div className="flex items-center gap-3 rounded-md border p-3">
              <FileSpreadsheet className="text-primary" />
              <div className="flex-1">
                <strong className="text-sm">{filename}</strong>
                <p className="text-xs text-muted-foreground">
                  {dateLabel(preview.date)} · {preview.records.length} bases válidas · {preview.headers.length} colunas
                </p>
              </div>
              {preview.errors.length ? <AlertCircle className="text-danger" /> : <CheckCircle2 className="text-success" />}
            </div>
            {preview.errors.length > 0 ? (
              <div role="alert" className="text-sm text-danger">
                <strong>Arquivo precisa de correções</strong>
                <ul className="list-disc pl-5">{preview.errors.slice(0, 10).map((message, index) => <li key={index}>{message}</li>)}</ul>
              </div>
            ) : <p className="text-sm text-success">As 12 colunas, a data e as bases foram validadas.</p>}
            {conflict && (
              <div role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
              {sameDate
                ? "Já existe um arquivo para esta data (" + conflict.filename + "). A substituição exige confirmação explícita; os registros não serão mesclados."
                : "Este nome de arquivo já foi importado para " + new Date(conflict.date + "T12:00:00").toLocaleDateString("pt-BR") + ". Confirme para adicionar esta nova data sem alterar o histórico existente."}
              </div>
            )}
            {preview.consolidated && (
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3 text-sm sm:grid-cols-4 lg:grid-cols-7">
                <span>Consolidado</span>
                <span>Veículos: <strong>{number(preview.consolidated.vehicles)}</strong></span>
                <span>Pacotes: <strong>{number(preview.consolidated.packages)}</strong></span>
                <span>Entregas: <strong>{number(preview.consolidated.deliveries)}</strong></span>
                <span>DC: <strong>{number(preview.consolidated.dc)}</strong></span>
                <span>Sinistro: <strong>{number(preview.consolidated.claims)}</strong></span>
                <span>Logistics: <strong>{percent(preview.consolidated.logistics)}</strong></span>
              </div>
            )}
            <div className="overflow-auto max-h-[52vh]">
              <table className="data-table min-w-[1450px]">
                <thead><tr>{preview.headers.map((header, index) => <th key={index}>{header}</th>)}</tr></thead>
                <tbody>
                  {preview.rows.slice(0, 6).map((row, rowIndex) => (
                    <tr key={rowIndex}>{row.map((cell, columnIndex) => <td key={columnIndex}>{display(cell, columnIndex)}</td>)}</tr>
                  ))}
                  {preview.consolidated && (
                    <tr className="font-semibold bg-muted">
                      <td>{dateLabel(preview.date)}</td><td>Consolidado</td>
                      <td>{number(preview.consolidated.vehicles)}</td><td>{number(preview.consolidated.packages)}</td>
                      <td>{number(preview.consolidated.deliveries)}</td><td>{number(preview.consolidated.dc)}</td>
                      <td>{number(preview.consolidated.claims)}</td><td>{number(preview.consolidated.failures)}</td>
                      <td>{number(preview.consolidated.pnr)}</td><td>{percent(preview.consolidated.logistics)}</td>
                      <td>{percent(preview.consolidated.withoutDc)}</td><td>{percent(preview.consolidated.withoutClaims)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Prévia das primeiras {Math.min(preview.records.length, 6)} de {preview.records.length} bases, mais o total oficial.
            </p>
          </>
        )}
        <div className="flex justify-end gap-2">
          {replaceArmed && <Button variant="outline" onClick={() => setReplaceArmed(false)}>Cancelar substituição</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button disabled={!ready} onClick={confirmImport}>
            {sameDate ? replaceArmed ? "Confirmar substituição" : "Substituir dados deste dia" : conflict ? replaceArmed ? "Confirmar nova data" : "Importar nome repetido" : "Importar para esta sessão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

