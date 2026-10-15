import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  percent,
  performanceTone,
  shortDate,
  TARGET,
  type BaseRow,
  type Metric,
  toneLabels,
} from "./data";
export type TrendPoint = { date: string; value: number | null };
export function EvolutionChart({ points }: { points: TrendPoint[] }) {
  const [days, setDays] = useState(7);
  const data = points.slice(-days).map((p) => ({ ...p, label: shortDate(p.date).slice(0, 5) }));
  return (
    <section className="chart-panel evolution-panel">
      <div className="chart-heading">
        <div>
          <h2>Evolução de performance</h2>
          <p>Acompanhamento diário do nível de serviço</p>
        </div>
        <div className="segmented-control">
          {[7, 14].map((d) => (
            <Button
              key={d}
              variant="ghost"
              size="sm"
              className={days === d ? "selected" : ""}
              onClick={() => setDays(d)}
            >
              {d} dias
            </Button>
          ))}
        </div>
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-line" />
          Performance
        </span>
        <span>
          <i className="legend-dash" />
          Meta 98,20%
        </span>
      </div>
      <div className="evolution-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 18, left: -25, bottom: 5 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              domain={[95, 100]}
              ticks={[95, 96, 97, 98, 99, 100]}
              tickFormatter={(n) => `${n}%`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as (TrendPoint & { label: string }) | undefined;
                return active && p ? (
                  <div className="chart-tooltip">
                    <strong>{shortDate(p.date)}</strong>
                    <span className={`tone-text-${performanceTone(p.value)}`}>
                      {percent(p.value)}
                    </span>
                    <small>{toneLabels[performanceTone(p.value)]}</small>
                  </div>
                ) : null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              fill="var(--primary-soft)"
              stroke="none"
              fillOpacity={0.6}
            />
            <ReferenceLine y={TARGET} stroke="var(--success)" strokeDasharray="5 4" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2.5}
              isAnimationActive={false}
              dot={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={payload.date}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={`var(--${performanceTone(payload.value)})`}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-foot">
        <TrendingUp size={15} />
        <span>
          Meta oficial de operação <strong>98,20%</strong>
        </span>
        <span className="text-muted-foreground ml-auto">Dados demonstrativos</span>
      </div>
    </section>
  );
}
export function RankingChart({ rows, metric }: { rows: BaseRow[]; metric: Metric }) {
  const [order, setOrder] = useState("best");
  const sorted = [...rows]
    .sort(
      (a, b) => (Number(b[metric] ?? -1) - Number(a[metric] ?? -1)) * (order === "best" ? 1 : -1),
    )
    .slice(0, 5);
  return (
    <section className="chart-panel ranking-panel">
      <div className="chart-heading">
        <div>
          <h2>Ranking de bases</h2>
          <p>Performance da operação</p>
        </div>
        <select
          className="compact-select"
          aria-label="Ordem do ranking"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        >
          <option value="best">Melhores bases</option>
          <option value="worst">Ofensores</option>
        </select>
      </div>
      <div className="ranking-list">
        {sorted.map((r, i) => (
          <Link to="/bases" search={{ base: r.base }} className="ranking-row" key={r.base}>
            <span className="ranking-position">{String(i + 1).padStart(2, "0")}</span>
            <div className="ranking-detail">
              <div className="flex justify-between gap-2">
                <strong>{r.base}</strong>
                <span className={`tone-text-${performanceTone(r[metric], r.packages > 0)}`}>
                  {percent(r[metric])}
                </span>
              </div>
              <div className="ranking-track">
                <div
                  className={`ranking-bar tone-bg-${performanceTone(r[metric], r.packages > 0)}`}
                  style={{ width: `${r[metric] ?? 0}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Button asChild variant="ghost" className="ranking-link">
        <Link to="/bases">
          Ver análise de todas as bases <ArrowUpRight />
        </Link>
      </Button>
    </section>
  );
}
