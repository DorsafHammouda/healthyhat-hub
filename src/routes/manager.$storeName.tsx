import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, TrendingUp, TrendingDown, Building2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAisleHeatmap,
  getAllStoreNames,
  getIntentVsReality,
  getRecentTrips,
  getRetentionRate,
  getTopNotFound,
} from "@/lib/mockManagerData";

export const Route = createFileRoute("/manager/$storeName")({
  head: ({ params }) => ({
    meta: [
      { title: `Store Insights: ${params.storeName} — HealthyHat Manager` },
      { name: "description", content: `Daily analytics overview for ${params.storeName}.` },
    ],
  }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const { storeName } = Route.useParams();
  const navigate = useNavigate();

  const intent = getIntentVsReality(storeName);
  const notFound = getTopNotFound(storeName);
  const retention = getRetentionRate(storeName);
  const heatmap = getAisleHeatmap(storeName);
  const trips = getRecentTrips(storeName);
  const stores = getAllStoreNames();

  const decoded = decodeURIComponent(storeName);

  return (
    <div className="manager-theme min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground transition hover:bg-secondary/80"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
              Customer View
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={decoded}
              onValueChange={(v) => navigate({ to: "/manager/$storeName", params: { storeName: v } })}
            >
              <SelectTrigger className="h-10 w-[200px] rounded-full border-border bg-card text-sm font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {stores.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="mb-6 flex items-center gap-3 md:mb-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Manager Portal</p>
            <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">
              Store Insights: {decoded} — Daily Overview
            </h1>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Pie chart */}
          <Card title="Shopping Intent vs. Reality" subtitle="Today's list outcomes">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intent}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {intent.map((d, i) => (
                      <Cell key={i} fill={d.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.28 0.04 250)",
                      border: "1px solid oklch(0.4 0.04 250)",
                      borderRadius: "0.75rem",
                      color: "oklch(0.95 0.02 240)",
                      fontWeight: 700,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontWeight: 700, fontSize: 12, color: "oklch(0.85 0.03 240)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Retention */}
          <Card title="Customer Return Rate" subtitle="48-hour retention">
            <div className="flex h-64 flex-col justify-center">
              <p className="text-6xl font-extrabold tracking-tight text-primary">
                {retention.rate}%
              </p>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                of users who couldn't find an item today returned within 48 hours
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground">
                {retention.delta >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
                {retention.delta >= 0 ? "+" : ""}
                {retention.delta}% vs last week
              </div>
            </div>
          </Card>

          {/* Bar chart */}
          <Card title="Top 'Not Found' Items" subtitle="Stock priorities">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={notFound} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" stroke="oklch(0.7 0.03 240)" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="item"
                    stroke="oklch(0.85 0.02 240)"
                    fontSize={11}
                    width={110}
                    tick={{ fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.28 0.04 250)",
                      border: "1px solid oklch(0.4 0.04 250)",
                      borderRadius: "0.75rem",
                      color: "oklch(0.95 0.02 240)",
                      fontWeight: 700,
                    }}
                    cursor={{ fill: "oklch(0.4 0.04 250 / 0.3)" }}
                  />
                  <Bar dataKey="count" fill="oklch(0.62 0.16 240)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Heatmap */}
          <Card title="Aisle Heatmap" subtitle="'Not Found' reports by section">
            <div className="grid h-64 grid-cols-4 gap-2">
              {heatmap.map((cell) => {
                const lightness = 0.35 + cell.intensity * 0.35;
                return (
                  <div
                    key={cell.aisle}
                    className="grid place-items-center rounded-xl text-center text-[11px] font-extrabold"
                    style={{
                      background: `oklch(${lightness} ${0.08 + cell.intensity * 0.1} 250)`,
                      color: cell.intensity > 0.5 ? "oklch(0.98 0.01 240)" : "oklch(0.92 0.02 240)",
                    }}
                  >
                    <div>
                      {cell.aisle}
                      <div className="mt-0.5 text-[10px] font-bold opacity-80">
                        {Math.round(cell.intensity * 100)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Trips table */}
        <div className="mt-6">
          <Card title="Recent Shopping Trips" subtitle="Anonymized — last 12 trips">
            <div className="max-h-80 overflow-y-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-foreground">User</TableHead>
                    <TableHead className="text-foreground">Time</TableHead>
                    <TableHead className="text-foreground">Items</TableHead>
                    <TableHead className="text-right text-foreground">Success Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((t, i) => {
                    const rate = Math.round((t.found / t.items) * 100);
                    return (
                      <TableRow key={i} className="border-border">
                        <TableCell className="font-bold">{t.user}</TableCell>
                        <TableCell className="text-muted-foreground">{t.time}</TableCell>
                        <TableCell>
                          {t.found}/{t.items}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${
                              rate >= 80
                                ? "bg-primary/20 text-primary"
                                : rate >= 50
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {rate}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_-12px_oklch(0.1_0.05_240_/_0.6)]">
      <div className="mb-4">
        <h2 className="text-base font-extrabold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs font-semibold text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
