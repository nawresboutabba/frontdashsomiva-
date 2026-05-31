import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { KPIs } from "@/api/types";
import { fmtNum } from "@/utils/format";

const COLORS = {
  EN_SERVICE: "var(--success)",
  EN_MAINTENANCE: "var(--warning)",
  EN_ARRET: "var(--destructive)",
};
const STATUS_LABEL: Record<string, string> = {
  EN_SERVICE: "En service",
  EN_MAINTENANCE: "En maintenance",
  EN_ARRET: "En arrêt",
};

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

export function StatusPie({ kpis }: { kpis: KPIs }) {
  const data = Object.entries(kpis.parStatut).map(([k, v]) => ({
    name: STATUS_LABEL[k],
    key: k,
    value: v,
  }));
  return (
    <Panel title="Statut des équipements" subtitle="Répartition du parc">
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              stroke="var(--card)"
            >
              {data.map((d) => (
                <Cell key={d.key} fill={COLORS[d.key as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function StockBar({ kpis }: { kpis: KPIs }) {
  return (
    <Panel title="Stock par catégorie" subtitle="Quantité totale en pièces">
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={kpis.stockParCategorie} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="categorie"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={fmtNum}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
            <Bar dataKey="stock" fill="var(--primary)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function MaintenanceLine({ kpis }: { kpis: KPIs }) {
  const data = kpis.maintenance30j.map((d) => ({
    date: d.date.slice(5),
    interventions: d.interventions,
  }));
  return (
    <Panel title="Activité maintenance" subtitle="30 derniers jours">
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="interventions"
              stroke="var(--info)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "var(--info)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
