// Fluxo Pessoal — dashboard editorial fintech escuro, com desktop assimétrico e navegação inferior mobile.
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  Edit3,
  FileSpreadsheet,
  Filter,
  Home as HomeIcon,
  LayoutGrid,
  Lightbulb,
  Menu,
  Pencil,
  Plus,
  Receipt,
  Search,
  Settings2,
  Sparkles,
  Sun,
  Trash2,
  TrendingUp,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { parseFinanceCsv, serializeFinanceCsv } from "@shared/financeCsv";
import type { CsvRejection } from "@shared/financeCsv";

const MARK_URL = "/manus-storage/fluxo-mark_57de0095.png";
const NOISE_URL = "/manus-storage/fluxo-noise_4fec77aa.png";
const ORB_URL = "/manus-storage/sarinha-orb_7340e9b1.png";
const EMPTY_URL = "/manus-storage/finance-empty-state_ec4080db.png";

type View = "overview" | "couple" | "accounts" | "investments" | "cards" | "trash";
type Person = "Felipe" | "Sara";

const navItems: Array<{ id: View; label: string; icon: typeof LayoutGrid }> = [
  { id: "overview", label: "Visão geral", icon: LayoutGrid },
  { id: "couple", label: "Casal", icon: UsersRound },
  { id: "accounts", label: "Contas", icon: Receipt },
  { id: "investments", label: "Investimentos", icon: BarChart3 },
  { id: "cards", label: "Cartão de crédito", icon: CreditCard },
  { id: "trash", label: "Lixeira", icon: Trash2 },
];

const transactions = [
  { day: "19 de ago", name: "Compra de mercado", category: "Casa", bank: "Inter", value: "R$ 236,40", color: "clay", icon: HomeIcon, kind: "Saída" },
  { day: "19 de ago", name: "Compra Home office", category: "Casa", bank: "Itaú", value: "R$ 389,90", color: "clay", icon: HomeIcon, kind: "Saída" },
  { day: "18 de ago", name: "Transferência da Rico", category: "Transferências", bank: "Rico", value: "R$ 1.200,00", color: "mint", icon: CircleDollarSign, kind: "Entrada" },
  { day: "18 de ago", name: "Lanches Sanduba (terça-feira)", category: "Alimentação", bank: "Inter", value: "R$ 38,50", color: "coral", icon: WalletCards, kind: "Saída" },
  { day: "18 de ago", name: "Saldo extra", category: "Transferências", bank: "Inter", value: "R$ 500,00", color: "mint", icon: CircleDollarSign, kind: "Entrada" },
];

const investments = [
  { description: "CDB 2 anos", category: "Renda fixa", institution: "PicPay", date: "18/08/2026", value: "R$ 387,13" },
  { description: "Rico Investimentos", category: "Ações", institution: "Rico", date: "18/08/2026", value: "R$ 1.871,00" },
  { description: "CDB", category: "Renda fixa", institution: "Inter", date: "13/08/2026", value: "R$ 316,09" },
  { description: "CDB", category: "Renda fixa", institution: "Inter", date: "13/08/2026", value: "R$ 2.700,53" },
];

const selectClass = "w-full appearance-none rounded-xl border border-white/15 bg-[#151d28] px-4 py-3 text-[13px] text-slate-200 outline-none transition hover:border-[#5b88ad] focus:border-[#5ea5e6]";

function SelectField({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <select className={selectClass}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#5d88ac]/70 bg-[#102b49] shadow-[0_8px_24px_rgba(0,0,0,.24)]">
        <img src={MARK_URL} className="h-8 w-8 object-contain" alt="" />
      </div>
      <div className="leading-none">
        <p className="font-serif text-[25px] font-bold tracking-[-0.06em] text-[#f1f4f7]">fluxo</p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9fb5c8]">pessoal</p>
      </div>
    </div>
  );
}

function PeriodControl({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "scale-95 origin-left" : ""}`}>
      <button className="period-btn" aria-label="Mês anterior"><ChevronRight className="h-4 w-4 rotate-180" /></button>
      <div className="period-select"><CalendarDays className="h-4 w-4 text-[#9bb6cc]" /><span>agosto de 2026</span><ChevronDown className="h-4 w-4 text-[#9bb6cc]" /></div>
      <button className="period-btn" aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}

function ActionButton({ children, onClick, variant = "primary", className = "" }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost"; className?: string }) {
  return <button onClick={onClick} className={`action-btn ${variant === "ghost" ? "action-ghost" : ""} ${className}`}>{children}</button>;
}

function StatCard({ label, value, detail, tone = "blue", icon: Icon }: { label: string; value: string; detail?: string; tone?: string; icon?: typeof TrendingUp }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-white/45" />}
      </div>
      <p className="stat-value">{value}</p>
      {detail && <p className="mt-2 text-xs text-slate-400">{detail}</p>}
    </article>
  );
}

function SectionHeader({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function ChartCard({ series }: { series?: Array<{ date: string; income: number; expenses: number }> }) {
    const max = Math.max(1, ...(series ?? []).flatMap((item) => [item.income, item.expenses]));
  const bars = series?.map((item) => ({ income: (item.income / max) * 100, expenses: (item.expenses / max) * 100, label: new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) })) ?? [];
  const scale = Math.max(1, Math.ceil(max / 1000) * 1000);
  return (
    <article className="panel chart-panel">
      <div className="flex items-start justify-between gap-4">
        <div><p className="eyebrow">movimento mensal</p><h2>Entradas e saídas</h2></div>
        <div className="legend"><span><i className="legend-dot bg-[#5da3df]" /> Entradas</span><span><i className="legend-dot bg-[#c9ab58]" /> Saídas</span></div>
      </div>
      <div className="chart-area">
        <div className="chart-y"><span>{formatMoney(scale)}</span><span>{formatMoney(scale * 0.66)}</span><span>{formatMoney(scale * 0.33)}</span><span>R$ 0</span></div>
        <div className="chart-bars">{bars.length ? bars.map((bar, i) => <div className="bar-group" key={i}><div className="bar bar-in" style={{ height: `${Math.max(4, bar.income)}%` }} /><div className="bar bar-out" style={{ height: `${Math.max(4, bar.expenses)}%` }} /></div>) : <div className="empty-state"><h2>Sem movimentações.</h2><p>Adicione lançamentos para visualizar o mês.</p></div>}</div>
      </div>
      <div className="chart-x">{bars.length ? bars.filter((_, index) => index === 0 || index === bars.length - 1 || index % Math.max(1, Math.floor(bars.length / 4)) === 0).map((bar, index) => <span key={`${bar.label}-${index}`}>{bar.label}</span>) : <span>sem dados</span>}</div>
    </article>
  );
}

function CommitmentCard({ commitment = 88 }: { commitment?: number }) {
  const normalized = Math.min(100, Math.max(0, commitment));
  const accounts = Math.min(45, normalized * 0.46);
  const cards = Math.min(30, normalized * 0.31);
  const investments = Math.max(0, normalized - accounts - cards);
  return (
    <article className="panel commitment-panel">
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">comprometimento da receita</p><h2>O dinheiro está encontrando destino.</h2></div><span className="trend-pill"><TrendingUp className="h-3.5 w-3.5" /> +12,4%</span></div>
      <div className="commitment-track"><span style={{ width: `${accounts}%` }} /><span style={{ width: `${cards}%` }} /><span style={{ width: `${investments}%` }} /></div>
      <div className="grid grid-cols-3 gap-3 pt-4"><div><p className="text-xs text-slate-500">Contas</p><p className="mt-1 text-sm font-semibold">{accounts.toFixed(0)}%</p></div><div><p className="text-xs text-slate-500">Cartões</p><p className="mt-1 text-sm font-semibold">{cards.toFixed(0)}%</p></div><div><p className="text-xs text-slate-500">Investimentos</p><p className="mt-1 text-sm font-semibold">{investments.toFixed(0)}%</p></div></div>
    </article>
  );
}

function DaySummary() {
  return <article className="panel day-panel"><div className="flex items-center gap-3"><div className="icon-tile mint"><CalendarDays className="h-5 w-5" /></div><div><p className="eyebrow">resumo de hoje</p><h2>Quarta-feira, 21 ago</h2></div></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="mini-stat"><p>Entradas</p><strong>R$ 1.200,00</strong></div><div className="mini-stat"><p>Saídas</p><strong className="text-[#e4b7aa]">R$ 626,80</strong></div></div><button onClick={() => toast.info("Detalhes do dia selecionado")} className="inline-link mt-5">Ver detalhes <ChevronRight className="h-4 w-4" /></button></article>;
}

function TransactionsCard({ onAdd }: { onAdd: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = transactions.filter((item) => `${item.name} ${item.category} ${item.bank}`.toLowerCase().includes(query.toLowerCase()));
  return <article className="panel transactions-panel"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">alimentação diária</p><h2>Lançamentos do dia a dia</h2><p className="mt-2 text-sm text-slate-400">Adicione uma linha por vez. O fluxo ativo é <strong className="text-slate-200">Felipe</strong>.</p></div><span className="profile-chip">FLUXO FELIPE</span></div><div className="mt-6 flex flex-wrap gap-3"><label className="search-wrap flex-1"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="buscar descrição, categoria ou banco" /></label><ActionButton onClick={onAdd}><Plus className="h-4 w-4" /> adicionar</ActionButton><ActionButton variant="ghost" onClick={() => toast.success("CSV preparado para exportação") }><Download className="h-4 w-4" /> CSV</ActionButton></div><p className="mt-5 text-xs text-slate-500">{filtered.length} lançamentos visíveis no mês</p><div className="transaction-list">{filtered.map((item) => <div className="transaction-row" key={`${item.day}-${item.name}`}><div className={`icon-tile ${item.color}`}><item.icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-200">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.day} · {item.category} · {item.bank}</p></div><div className="text-right"><p className={`font-semibold ${item.kind === "Entrada" ? "text-[#a8d7c2]" : "text-[#e2b5aa]"}`}>{item.kind === "Entrada" ? "+" : "-"}{item.value}</p><button className="edit-link" onClick={() => toast.info(`Editando ${item.name}`)}><Edit3 className="h-3 w-3" /> editar</button></div></div>)}</div></article>;
}

function formatMoney(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function resolveBillStatus(status: "pending" | "paid" | "late", dueDate: Date) { return status === "paid" ? "paid" : new Date(dueDate).getTime() < Date.now() ? "late" : "pending"; }

function LiveTransactionsCard({ onAdd, profileId }: { onAdd: () => void; profileId?: number }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.transactions.useQuery({ profileId }, { enabled: isAuthenticated && !!profileId });
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [bank, setBank] = useState("");
  const [category, setCategory] = useState("");
  const [direction, setDirection] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = trpc.finance.importTransactions.useMutation();
  const [importReport, setImportReport] = useState<{ total: number; created: number; skipped: number; rejected: CsvRejection[] } | null>(null);
  const utils = trpc.useUtils();
  const source = data ?? [];
  const handleImport = async (file: File) => {
    if (!profileId) return;
    const parsed = parseFinanceCsv(await file.text());
    if (parsed.rejected.length) toast.warning(`${parsed.rejected.length} linha(s) rejeitada(s). ${parsed.rejected[0]?.reason ?? "Revise o arquivo."}`);
    if (!parsed.rows.length) { setImportReport({ total: parsed.rejected.length, created: 0, skipped: 0, rejected: parsed.rejected }); return; }
    importMutation.mutate({ profileId, rows: parsed.rows }, { onSuccess: (result) => { utils.finance.transactions.invalidate(); utils.finance.bootstrap.invalidate(); setImportReport({ total: parsed.rows.length + parsed.rejected.length, created: result.created, skipped: result.skipped, rejected: parsed.rejected }); toast.success(`${result.created} lançamento(s) importado(s); ${result.skipped} duplicado(s) ignorado(s)`); }, onError: () => toast.error("Não foi possível importar o CSV") });
  };
  const filtered = source.filter((item) => { const matchesText = `${item.description} ${item.category} ${item.bank}`.toLowerCase().includes(query.toLowerCase()); const matchesMonth = !month || new Date(item.date).toISOString().slice(0, 7) === month; const matchesBank = !bank || item.bank === bank; const matchesCategory = !category || item.category === category; const matchesDirection = !direction || item.direction === direction; return matchesText && matchesMonth && matchesBank && matchesCategory && matchesDirection; });
  const months = Array.from(new Set(source.map((item) => new Date(item.date).toISOString().slice(0, 7))));
  const banks = Array.from(new Set(source.map((item) => item.bank)));
  const categories = Array.from(new Set(source.map((item) => item.category)));
  return <article className="panel transactions-panel"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">alimentação diária</p><h2>Lançamentos persistidos</h2><p className="mt-2 text-sm text-slate-400">A lista agora é alimentada pelo banco de dados.</p></div><span className="profile-chip">{filtered.length} REGISTROS</span></div><div className="mt-6 flex flex-wrap gap-3"><label className="search-wrap flex-1"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="buscar descrição, categoria ou banco" /></label><select className="select-field" value={month} onChange={(e) => setMonth(e.target.value)}><option value="">Todos os meses</option>{months.map((item) => <option key={item} value={item}>{item}</option>)}</select><select className="select-field" value={bank} onChange={(e) => setBank(e.target.value)}><option value="">Todos os bancos</option>{banks.map((item) => <option key={item} value={item}>{item}</option>)}</select><select className="select-field" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Todas as categorias</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><select className="select-field" value={direction} onChange={(e) => setDirection(e.target.value)}><option value="">Entradas e saídas</option><option value="in">Entradas</option><option value="out">Saídas</option></select><ActionButton onClick={onAdd}><Plus className="h-4 w-4" /> adicionar</ActionButton><input ref={fileInputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImport(file); event.target.value = ""; }} /><ActionButton variant="ghost" onClick={() => { if (!importMutation.isPending) fileInputRef.current?.click(); }}><FileSpreadsheet className="h-4 w-4" /> {importMutation.isPending ? "importando..." : "importar CSV"}</ActionButton><ActionButton variant="ghost" onClick={() => { const csv = serializeFinanceCsv(filtered.map((item) => ({ date: new Date(item.date).toISOString().slice(0, 10), description: item.description, category: item.category, bank: item.bank, direction: item.direction, amount: Number(item.amount) }))); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "fluxo-lancamentos.csv"; link.click(); URL.revokeObjectURL(url); toast.success("CSV exportado") }}><Download className="h-4 w-4" /> exportar CSV</ActionButton></div>{importReport && <div className="import-report"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">relatório da importação</p><h3>{importReport.created} importado(s) · {importReport.skipped} duplicado(s) · {importReport.rejected.length} rejeitado(s)</h3><p className="mt-1 text-xs text-slate-500">{importReport.total} linha(s) processada(s). Verifique os detalhes antes de corrigir o arquivo.</p></div><button className="edit-link" onClick={() => setImportReport(null)}><X className="h-3 w-3" /> fechar</button></div>{importReport.rejected.length > 0 && <div className="import-errors">{importReport.rejected.map((item) => <div key={`${item.line}-${item.reason}`}><strong>Linha {item.line}</strong><span>{item.reason}</span><code>{item.raw}</code></div>)}</div>}</div>}<div className="transaction-list">{filtered.length === 0 ? <div className="empty-state"><img src={EMPTY_URL} alt="" /><h2>Nenhum lançamento encontrado.</h2><p>Adicione um registro ou ajuste a busca.</p></div> : filtered.map((item) => <div className="transaction-row" key={item.id}><div className={`icon-tile ${item.direction === "in" ? "mint" : "clay"}`}><CircleDollarSign className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-200">{item.description}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.date).toLocaleDateString("pt-BR")} · {item.category} · {item.bank}</p></div><p className={`font-semibold ${item.direction === "in" ? "text-[#a8d7c2]" : "text-[#e2b5aa]"}`}>{item.direction === "in" ? "+" : "-"}{formatMoney(Number(item.amount))}</p></div>)}</div></article>;
}

function RoutineCard({ profileId }: { profileId?: number }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.routine.useQuery(profileId ? { profileId, month: "2026-08" } : undefined as never, { enabled: isAuthenticated && !!profileId });
  const reminders = (data?.reminders ?? []).filter((item) => !item.readAt).slice(0, 3);
  const overdueBills = data?.overdueBills ?? [];
  const upcomingBills = data?.upcomingBills ?? [];
  const budgets = data?.budgetSummary ?? [];
  return <article className="panel routine-panel"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">rotina financeira</p><h2>Próximos compromissos</h2></div><button className="inline-link" onClick={() => toast.info("A central de lembretes será ampliada no próximo marco")}>ver tudo <ChevronRight className="h-4 w-4" /></button></div>{overdueBills.length ? overdueBills.slice(0, 2).map((item) => <div className="routine-row" key={`late-${item.id}`}><div className="icon-tile clay"><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-medium text-[#e2b5aa]">Atrasada: {item.description}</p><p className="mt-1 text-xs text-slate-500">Venceu em {new Date(item.dueDate).toLocaleDateString("pt-BR")}</p></div></div>) : upcomingBills.length ? upcomingBills.slice(0, 2).map((item) => <div className="routine-row" key={`upcoming-${item.id}`}><div className="icon-tile gold"><CalendarDays className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-medium text-slate-200">{item.description}</p><p className="mt-1 text-xs text-slate-500">Vence em {new Date(item.dueDate).toLocaleDateString("pt-BR")} · {formatMoney(Number(item.amount))}</p></div></div>) : reminders.length ? reminders.map((item) => <div className="routine-row" key={item.id}><div className="icon-tile gold"><Bell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-medium text-slate-200">{item.title}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.dueDate).toLocaleDateString("pt-BR")} · {item.kind}</p></div></div>) : <div className="empty-state compact"><h2>Nenhum lembrete próximo.</h2><p>As contas importantes aparecerão aqui.</p></div>}{budgets.length ? <div className="routine-budget"><span>Orçamento · {budgets[0].category}</span><strong>{formatMoney(budgets[0].spent)} / {formatMoney(budgets[0].limit)}</strong><div className="progress-line"><span style={{ width: `${budgets[0].percent}%` }} /></div></div> : <div className="routine-budget"><span>Recorrências ativas</span><strong>{data?.recurring?.filter((item) => item.active).length ?? 0}</strong></div>}</article>;
}

function GovernanceCard({ profileId }: { profileId?: number }) {
  const { isAuthenticated } = useAuth();
  const { data: audit = [] } = trpc.finance.audit.useQuery({ limit: 6 }, { enabled: isAuthenticated });
  const { data: backups = [] } = trpc.finance.backups.useQuery(undefined, { enabled: isAuthenticated });
  const createBackup = trpc.finance.createBackup.useMutation();
  const restoreBackup = trpc.finance.restoreBackup.useMutation();
  const utils = trpc.useUtils();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [selectedBackupId, setSelectedBackupId] = useState<number | undefined>();
  const [selectedBackupLabel, setSelectedBackupLabel] = useState("fluxo-backup");
  const getBackup = trpc.finance.getBackup.useQuery({ id: selectedBackupId ?? 1 }, { enabled: isAuthenticated && selectedBackupId !== undefined });
  useEffect(() => {
    if (!getBackup.data || selectedBackupId === undefined) return;
    const blob = new Blob([getBackup.data.payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${selectedBackupLabel.toLowerCase().replace(/\\s+/g, "-")}.json`; link.click(); URL.revokeObjectURL(url);
    setSelectedBackupId(undefined);
  }, [getBackup.data, selectedBackupId, selectedBackupLabel]);
  const downloadBackup = (id: number, label: string) => { setSelectedBackupLabel(label); setSelectedBackupId(id); };
  const makeBackup = () => createBackup.mutate({ label: `Backup de ${new Date().toLocaleDateString("pt-BR")}` }, { onSuccess: (backup) => { const blob = new Blob([backup.payload], { type: "application/json;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "fluxo-backup.json"; link.click(); URL.revokeObjectURL(url); toast.success("Backup criado e baixado"); }, onError: () => toast.error("Não foi possível criar o backup") });
  const handleRestore = async (file: File) => {
    if (!profileId) return;
    try {
      const snapshot = JSON.parse(await file.text()) as { data?: { transactions?: unknown[] } };
      if (!snapshot.data?.transactions || !window.confirm("Restaurar este backup? Os lançamentos serão mesclados e duplicados serão ignorados. Contas, cartões e investimentos não são alterados por esta restauração.")) return;
      restoreBackup.mutate({ profileId, snapshot }, { onSuccess: (result) => { utils.finance.bootstrap.invalidate(); utils.finance.audit.invalidate(); toast.success(`${result.created} lançamento(s) restaurado(s); ${result.skipped} duplicado(s) ignorado(s)`); }, onError: () => toast.error("Backup inválido ou incompatível") });
    } catch { toast.error("Não foi possível ler o backup JSON"); }
  };
  return <article className="panel governance-panel"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">governança do fluxo</p><h2>Histórico essencial e backup</h2><p className="mt-2 text-sm text-slate-400">Acompanhe lançamentos auditados e mantenha um snapshot completo. A restauração recompõe lançamentos por merge, sem apagar dados atuais.</p></div><div className="flex flex-wrap gap-2"><ActionButton onClick={makeBackup}>{createBackup.isPending ? "criando..." : <><Download className="h-4 w-4" /> backup</>}</ActionButton><ActionButton variant="ghost" onClick={() => restoreInputRef.current?.click()}><Receipt className="h-4 w-4" /> restaurar</ActionButton><input ref={restoreInputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleRestore(file); event.target.value = ""; }} /></div></div><div className="governance-grid"><div><p className="eyebrow">últimas alterações</p>{audit.length ? audit.slice(0, 4).map((item) => <div className="governance-row" key={item.id}><span>{item.action === "create" ? "Criado" : item.action === "delete" ? "Excluído" : item.action}</span><strong>{item.summary}</strong><small>{new Date(item.createdAt).toLocaleString("pt-BR")}</small></div>) : <p className="empty-copy">Nenhuma alteração auditada ainda.</p>}</div><div><p className="eyebrow">backups salvos</p>{backups.length ? backups.slice(0, 4).map((backup) => <button className="governance-row backup-row" key={backup.id} onClick={() => void downloadBackup(backup.id, backup.label)}><span>{backup.label}</span><small>{new Date(backup.createdAt).toLocaleString("pt-BR")}</small><Download className="h-3.5 w-3.5" /></button>) : <p className="empty-copy">Crie um backup para aparecer aqui.</p>}</div></div></article>;
}

function Overview({ onAdd, profileId, summary }: { onAdd: () => void; profileId?: number; summary?: { balance: number; income: number; expenses: number; invested: number; commitment: number; series?: Array<{ date: string; income: number; expenses: number }> } }) {
  return <div className="space-y-5"><div className="welcome-band" style={{ backgroundImage: `linear-gradient(90deg, rgba(15,31,49,.97), rgba(15,31,49,.86)), url(${NOISE_URL})` }}><div><p className="eyebrow text-[#9ec4e2]">fluxo pessoal · agosto de 2026</p><h1>Seu dinheiro, em perspectiva.</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">Uma leitura calma para as decisões que importam. Acompanhe seu mês sem perder o fio.</p></div><div className="welcome-actions"><PeriodControl /><ActionButton onClick={onAdd}><Plus className="h-4 w-4" /> novo lançamento</ActionButton></div></div><div className="stats-grid"><StatCard label="Saldo consolidado" value={formatMoney(summary?.balance ?? 597.88)} detail="entradas menos saídas do período" tone="blue" icon={CircleDollarSign} /><StatCard label="Entradas" value={formatMoney(summary?.income ?? 8240)} detail="dados calculados" tone="mint" icon={ArrowDownLeft} /><StatCard label="Saídas" value={formatMoney(summary?.expenses ?? 7642.12)} detail="dados calculados" tone="clay" icon={ArrowUpRight} /><StatCard label="Investido" value={formatMoney(summary?.invested ?? 5274.75)} detail="patrimônio acompanhado" tone="gold" icon={TrendingUp} /></div><div className="content-grid"><ChartCard series={summary?.series} /><CommitmentCard commitment={summary?.commitment} /><DaySummary /><RoutineCard profileId={profileId} /><aside className="assistant-card"><div className="assistant-orb"><img src={ORB_URL} alt="" /></div><div><p className="eyebrow">sarinha ia</p><h2>Um olhar para o seu mês</h2><p className="mt-2 text-sm leading-6 text-slate-400">Você está mantendo 18% da receita em investimentos. Quer observar esse ritmo juntos?</p></div><button onClick={() => toast.success("Sarinha IA: análise adicionada ao seu resumo") } className="assistant-action">Conversar com a Sarinha <ChevronRight className="h-4 w-4" /></button></aside></div><LiveTransactionsCard onAdd={onAdd} profileId={profileId} /><GovernanceCard profileId={profileId} /></div>;
}

type FilterValues = { month?: string; bank?: string; category?: string; cardId?: string };

function FilterBar({ type, values = {}, onChange, cardOptions = [] }: { type: "accounts" | "investments" | "cards"; values?: FilterValues; onChange?: (values: FilterValues) => void; cardOptions?: Array<{ id: number; name: string }> }) {
  const set = (key: keyof FilterValues, value: string) => onChange?.({ ...values, [key]: value || undefined });
  return <div className="filter-bar"><div className="filter-title"><Filter className="h-4 w-4 text-[#8aa9c1]" /><span>filtrar visão</span></div><select className="select-field" value={values.month ?? ""} onChange={(event) => set("month", event.target.value)}><option value="">Todos os meses</option><option value="2026-08">agosto de 2026</option><option value="2026-07">julho de 2026</option></select>{type === "investments" && <select className="select-field" value={values.bank ?? ""} onChange={(event) => set("bank", event.target.value)}><option value="">Todos os bancos</option><option value="Inter">Inter</option><option value="Rico">Rico</option><option value="PicPay">PicPay</option></select>}{type === "cards" && <select className="select-field" value={values.cardId ?? ""} onChange={(event) => set("cardId", event.target.value)}><option value="">Todos os cartões</option>{cardOptions.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select>}{type !== "cards" && <select className="select-field" value={values.category ?? ""} onChange={(event) => set("category", event.target.value)}><option value="">Todas as categorias</option><option value="Renda fixa">Renda fixa</option><option value="Casa">Casa</option><option value="Alimentação">Alimentação</option></select>}{(type === "accounts" || type === "investments") && <ActionButton variant="ghost" onClick={() => toast.success("CSV preparado para exportação")}><Download className="h-4 w-4" /> exportar CSV</ActionButton>}</div>;
}

function Accounts({ profileId }: { profileId?: number }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.bootstrap.useQuery({ profileId }, { enabled: isAuthenticated && !!profileId });
  const bills = data?.bills ?? [];
  const markPaid = trpc.finance.markBillPaid.useMutation();
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const visibleBills = bills.filter((bill) => (!statusFilter || resolveBillStatus(bill.status, bill.dueDate) === statusFilter) && (!monthFilter || new Date(bill.dueDate).toISOString().slice(0, 7) === monthFilter));
  const pending = bills.filter((bill) => resolveBillStatus(bill.status, bill.dueDate) === "pending");
  const paid = bills.filter((bill) => resolveBillStatus(bill.status, bill.dueDate) === "paid");
  const late = bills.filter((bill) => resolveBillStatus(bill.status, bill.dueDate) === "late");
  return <div className="space-y-5"><SectionHeader eyebrow="contas do mês · agosto de 2026" title="Contas a pagar" subtitle="Um lugar claro para acompanhar os compromissos que não podem escapar." actions={<ActionButton onClick={() => toast.info("O formulário de contas será conectado no próximo marco") }><Plus className="h-4 w-4" /> adicionar conta</ActionButton>} /><div className="account-toolbar"><span className="profile-chip">{bills.length} CONTAS</span><select className="select-field" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}><option value="">Todos os meses</option><option value="2026-08">agosto de 2026</option><option value="2026-07">julho de 2026</option></select><select className="select-field w-56" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todas</option><option value="pending">Pendentes</option><option value="paid">Pagas</option><option value="late">Atrasadas</option></select></div><div className="stats-grid three"><StatCard label="Vencimentos" value={String(bills.length || 1)} detail="neste mês" tone="gold" icon={CalendarDays} /><StatCard label="Pendentes" value={String(pending.length)} detail="aguardando pagamento" tone="clay" icon={Bell} /><StatCard label="Pagas" value={String(paid.length)} detail="até o momento" tone="mint" icon={Check} /><StatCard label="Atrasadas" value={String(late.length)} detail="exigem atenção" tone="clay" icon={Bell} /></div><article className="panel bills-panel"><div className="list-head"><span className="checkbox" /><span>selecionar contas</span><span className="ml-auto text-xs uppercase tracking-[.14em] text-slate-500">status</span></div>{visibleBills.length ? visibleBills.map((bill) => <div className="bill-row" key={bill.id}><span className="checkbox" /><div className="icon-tile gold"><CalendarDays className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-200">{bill.description}</p><p className="mt-1 text-xs text-slate-500">Vencimento: {new Date(bill.dueDate).toLocaleDateString("pt-BR")} · Responsável: {bill.responsible}</p></div><strong>{formatMoney(Number(bill.amount))}</strong><span className={`status ${resolveBillStatus(bill.status, bill.dueDate) === "paid" ? "paid" : resolveBillStatus(bill.status, bill.dueDate) === "late" ? "late" : "pending"}`}>{resolveBillStatus(bill.status, bill.dueDate) === "paid" ? "Paga" : resolveBillStatus(bill.status, bill.dueDate) === "late" ? "Atrasada" : "Pendente"}</span><button className="square-btn" onClick={() => { markPaid.mutate({ id: bill.id, paid: bill.status !== "paid" }, { onSuccess: () => { utils.finance.bootstrap.invalidate(); toast.success(bill.status === "paid" ? "Conta reaberta" : "Conta marcada como paga"); }, onError: () => toast.error("Não foi possível atualizar a conta") }); }} aria-label={bill.status === "paid" ? "Reabrir conta" : "Marcar conta como paga"}>{bill.status === "paid" ? <Receipt className="h-4 w-4" /> : <Check className="h-4 w-4" />}</button></div>) : <div className="empty-state"><h2>Nenhuma conta cadastrada.</h2><p>Adicione sua primeira conta para acompanhar vencimentos.</p></div>}</article></div>;
}

function Investments({ profileId }: { profileId?: number }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.bootstrap.useQuery({ profileId }, { enabled: isAuthenticated && !!profileId });
  const [monthFilter, setMonthFilter] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const allRows = data?.investments ?? [];
  const rows = allRows.filter((item) => (!monthFilter || new Date(item.investedAt).toISOString().slice(0, 7) === monthFilter) && (!bankFilter || item.institution === bankFilter) && (!categoryFilter || item.category === categoryFilter));
  const invested = rows.reduce((sum, item) => sum + Number(item.investedAmount), 0);
  const market = rows.reduce((sum, item) => sum + Number(item.marketValue), 0);
  return <div className="space-y-5"><SectionHeader eyebrow="patrimônio do fluxo felipe" title="Investimentos" actions={<><ActionButton variant="ghost" onClick={() => toast.info("Edição de investimentos será conectada no próximo marco")}><Pencil className="h-4 w-4" /></ActionButton><ActionButton onClick={() => toast.info("O formulário de investimentos será conectado no próximo marco")}><Plus className="h-4 w-4" /> novo investimento</ActionButton></>} /><FilterBar type="investments" values={{ month: monthFilter, bank: bankFilter, category: categoryFilter }} onChange={(next) => { setMonthFilter(next.month ?? ""); setBankFilter(next.bank ?? ""); setCategoryFilter(next.category ?? ""); }} /><div className="stats-grid four"><StatCard label="Total investido" value={formatMoney(rows.length ? invested : 5274.75)} tone="blue" /><StatCard label="Valor de mercado" value={formatMoney(rows.length ? market : 5274.75)} tone="mint" /><StatCard label="Resultado" value={formatMoney(rows.length ? market - invested : 0)} tone="gold" /><StatCard label="Última atualização" value={rows[0] ? new Date(rows[0].investedAt).toLocaleDateString("pt-BR") : "sem dados"} tone="clay" /></div><div className="institution-strip"><p className="eyebrow">saldo por instituição</p><div className="flex flex-wrap gap-8">{rows.length ? Array.from(new Set(rows.map((item) => item.institution))).map((institution) => <span key={institution}>{institution} <strong>{formatMoney(rows.filter((item) => item.institution === institution).reduce((sum, item) => sum + Number(item.marketValue), 0))}</strong></span>) : <span>Cadastre seu primeiro investimento para acompanhar por instituição.</span>}</div></div><article className="panel table-panel"><div className="data-table desktop-table"><div className="table-row table-header"><span className="checkbox" /><span>descrição</span><span>categoria</span><span>instituição ↑</span><span>data ↑</span><span className="text-right">valor ↓</span><span /></div>{rows.length ? rows.map((item, index) => <div className={`table-row ${index % 2 ? "selected-row" : ""}`} key={item.id}><span className="checkbox" /><strong>{item.description}</strong><span>{item.category}</span><span>{item.institution}</span><span>{new Date(item.investedAt).toLocaleDateString("pt-BR")}</span><strong className="text-right">{formatMoney(Number(item.marketValue))}</strong><button className="square-btn" onClick={() => toast.info(`Editando ${item.description}`)}><Pencil className="h-4 w-4" /></button></div>) : <div className="empty-state"><h2>Nenhum investimento cadastrado.</h2><p>Adicione um investimento para acompanhar seu patrimônio.</p></div>}</div><div className="mobile-investments">{rows.map((item) => <div className="mobile-investment-row" key={`${item.id}-mobile`}><div><p className="font-semibold text-slate-200">{item.description}</p><p className="mt-1 text-xs text-slate-500">{item.category} · {item.institution} · {new Date(item.investedAt).toLocaleDateString("pt-BR")}</p></div><strong>{formatMoney(Number(item.marketValue))}</strong></div>)}</div></article></div>;
}

function Cards({ profileId }: { profileId?: number }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.bootstrap.useQuery({ profileId }, { enabled: isAuthenticated && !!profileId });
  const cardInstallments = data?.summary.cardInstallments ?? 0;
  const cardTotal = data?.summary.cardTotal ?? 0;
  const purchaseRows = data?.purchases ?? [];
  const cards = data?.cards ?? [];
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>();
  const [cardMonth, setCardMonth] = useState("");
  const [showTotal, setShowTotal] = useState(false);
  const visiblePurchases = purchaseRows.filter((item) => (!cardMonth || new Date(item.purchaseDate).toISOString().slice(0, 7) === cardMonth) && (!selectedCardId || item.cardId === selectedCardId));
  const visibleInstallments = visiblePurchases.reduce((sum, item) => sum + Number(item.installmentAmount), 0);
  const visibleTotal = visiblePurchases.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  return <div className="space-y-5"><SectionHeader eyebrow="controle separado · agosto de 2026" title="Cartão de crédito" actions={<><ActionButton variant="ghost" onClick={() => toast.info("Modo de edição ativado")}><Pencil className="h-4 w-4" /></ActionButton><ActionButton onClick={() => toast.success("Formulário de fatura aberto")}><Plus className="h-4 w-4" /> cadastrar e salvar fatura</ActionButton></>} /><FilterBar type="cards" cardOptions={cards} values={{ month: cardMonth, cardId: selectedCardId?.toString() }} onChange={(next) => { setCardMonth(next.month ?? ""); setSelectedCardId(next.cardId ? Number(next.cardId) : undefined); }} /><div className="segmented"><span>Mostrar compras por</span><button className={!showTotal ? "active" : ""} onClick={() => setShowTotal(false)}>Parcela do mês</button><button className={showTotal ? "active" : ""} onClick={() => setShowTotal(true)}>Valor total</button></div><div className="segmented"><span>Exibir</span><button className="active">Todas</button><button>Só parceladas do mês</button></div><ActionButton onClick={() => toast.success("CSV preparado para exportação")}><Download className="h-4 w-4" /> exportar CSV</ActionButton><article className="panel card-statement"><div className="statement-head"><span className="checkbox" /><span>Cartão <span className="sort-badge">↕</span></span><span>Mês <span className="sort-badge">↕</span></span></div>{cards.length ? cards.map((card) => <button className={`statement-row text-left ${selectedCardId === card.id ? "selected-row" : ""}`} key={card.id} onClick={() => setSelectedCardId(selectedCardId === card.id ? undefined : card.id)}><span className="checkbox" /><span>{card.name}</span><span>agosto de 2026</span></button>) : <div className="empty-state"><h2>Nenhum cartão cadastrado.</h2><p>Cadastre um cartão para controlar suas faturas.</p></div>}<div className="statement-total"><div><p className="eyebrow">fechamento dia 13 · vencimento dia 20</p><h2>Fatura de agosto</h2><p className="mt-2 text-sm text-slate-400">{visiblePurchases.length} compras internas · em aberto</p></div><strong>{formatMoney(showTotal ? (selectedCardId ? visibleTotal : cardTotal) : (selectedCardId ? visibleInstallments : cardInstallments))}</strong><button className="inline-link" onClick={() => toast.info("Detalhes da fatura")}>ver detalhes <ChevronRight className="h-4 w-4" /></button></div></article></div>;
}

function Couple() {
  return <div className="space-y-5"><SectionHeader eyebrow="visão consolidada · agosto de 2026" title="Resumo geral do casal" subtitle="Felipe + Sara em uma única leitura visual." actions={<ActionButton onClick={() => toast.info("Alternando perfil do casal") }><UsersRound className="h-4 w-4" /> visão compartilhada</ActionButton>} /><div className="couple-hero"><div className="couple-figures"><UserRound className="h-10 w-10" /><UsersRound className="h-12 w-12 -ml-3" /></div><div><p className="eyebrow">duas rotinas, um só fluxo</p><h2>Decisões financeiras também podem ser leves.</h2><p className="mt-2 text-sm text-slate-400">Veja o saldo da casa, os compromissos de cada pessoa e o que está sendo construído em conjunto.</p></div></div><div className="stats-grid three"><StatCard label="Saldo consolidado" value="R$ 597,88" detail="contas e pagamentos do mês" tone="blue" /><StatCard label="Entradas" value="R$ 10.240,00" detail="Felipe + Sara" tone="mint" /><StatCard label="Saídas" value="R$ 9.642,12" detail="contas e cartões" tone="clay" /></div><div className="content-grid couple-grid"><article className="panel person-panel"><div className="person-head"><div className="avatar avatar-blue">F</div><div><p className="eyebrow">fluxo felipe</p><h2>Visão individual</h2></div><ChevronRight className="ml-auto h-5 w-5 text-slate-500" /></div><p className="person-value">R$ 597,88</p><div className="progress-line"><span style={{ width: "64%" }} /></div><p className="mt-3 text-xs text-slate-500">64% do saldo consolidado</p></article><article className="panel person-panel"><div className="person-head"><div className="avatar avatar-purple">S</div><div><p className="eyebrow">fluxo sara</p><h2>Visão individual</h2></div><ChevronRight className="ml-auto h-5 w-5 text-slate-500" /></div><p className="person-value">R$ 0,00</p><div className="progress-line purple"><span style={{ width: "36%" }} /></div><p className="mt-3 text-xs text-slate-500">36% do saldo consolidado</p></article></div></div>;
}

function Trash({ profileId }: { profileId?: number }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.bootstrap.useQuery({ profileId }, { enabled: isAuthenticated && !!profileId });
  const restore = trpc.finance.restoreTrash.useMutation();
  const permanentlyDelete = trpc.finance.permanentlyDeleteTrash.useMutation();
  const utils = trpc.useUtils();
  const items = data?.trash ?? [];
  return <div className="space-y-5"><SectionHeader eyebrow="itens removidos · agosto de 2026" title="Lixeira" subtitle="Recupere um registro ou remova tudo de forma permanente." actions={<><ActionButton variant="ghost" onClick={() => toast.info(`${items.length} itens na lixeira`)}><Check className="h-4 w-4" /> selecionar tudo</ActionButton><ActionButton onClick={() => toast.info("A exclusão permanente em lote será adicionada depois da confirmação individual") }><Trash2 className="h-4 w-4" /> esvaziar lixeira</ActionButton></>} /><article className="panel trash-panel">{items.length === 0 ? <div className="empty-state"><img src={EMPTY_URL} alt="" /><h2>Lixeira vazia.</h2><p>Nada por aqui — tudo o que foi excluído já foi restaurado ou removido.</p></div> : items.map((item) => <div className="trash-row" key={item.id}><div className="icon-tile clay"><Trash2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-200">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.entityType} · removido em {new Date(item.deletedAt).toLocaleDateString("pt-BR")}</p></div><div className="flex items-center gap-2"><button className="restore-btn" disabled={restore.isPending} onClick={() => { restore.mutate({ id: item.id }, { onSuccess: () => { utils.finance.bootstrap.invalidate(); toast.success("Item restaurado"); }, onError: () => toast.error("Não foi possível restaurar o item") }); }}>restaurar</button><button className="icon-button-danger" aria-label="Excluir permanentemente" disabled={permanentlyDelete.isPending} onClick={() => { if (!window.confirm("Excluir este item permanentemente? Esta ação não pode ser desfeita.")) return; permanentlyDelete.mutate({ id: item.id }, { onSuccess: () => { utils.finance.bootstrap.invalidate(); toast.success("Item removido permanentemente"); }, onError: () => toast.error("Não foi possível remover o item") }); }}>×</button></div></div>)}</article></div>;
}

function AddModal({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState("Saída");
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-start justify-between"><div><p className="eyebrow">novo registro</p><h2>Adicionar movimentação</h2><p className="mt-2 text-sm text-slate-400">Inclua uma linha no seu fluxo de agosto.</p></div><button className="modal-close" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="modal-form"><label>Descrição<input placeholder="ex.: mercado, salário, transferência" /></label><label>Data<input type="date" defaultValue="2026-08-21" /></label><label>Categoria<SelectField><option>Casa</option><option>Alimentação</option><option>Transferências</option><option>Investimentos</option></SelectField></label><label>Banco<SelectField><option>Inter</option><option>Rico</option><option>PicPay</option><option>Itaú</option></SelectField></label><div className="kind-toggle"><button className={kind === "Entrada" ? "active" : ""} onClick={() => setKind("Entrada")}><ArrowDownLeft className="h-4 w-4" /> Entrada</button><button className={kind === "Saída" ? "active" : ""} onClick={() => setKind("Saída")}><ArrowUpRight className="h-4 w-4" /> Saída</button></div><label>Valor<input placeholder="R$ 0,00" inputMode="decimal" /></label></div><div className="modal-footer"><button className="text-sm text-slate-400 transition hover:text-white" onClick={onClose}>cancelar</button><ActionButton onClick={() => { toast.success("Movimentação adicionada ao fluxo"); onClose(); }}><Check className="h-4 w-4" /> adicionar {kind.toLowerCase()}</ActionButton></div></div></div>;
}

function PersistentAddModal({ onClose, profileId }: { onClose: () => void; profileId?: number }) {
  const [kind, setKind] = useState<"in" | "out">("out");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("2026-08-21");
  const [category, setCategory] = useState("Casa");
  const [bank, setBank] = useState("Inter");
  const mutation = trpc.finance.createTransaction.useMutation();
  const utils = trpc.useUtils();
  const submit = () => {
    const numericAmount = Number(amount.replace(",", "."));
    if (!profileId) { toast.error("Faça login para salvar seus lançamentos"); return; }
    if (!description.trim() || !numericAmount || numericAmount <= 0) { toast.error("Informe descrição e valor válidos"); return; }
    mutation.mutate({ profileId, date: new Date(`${date}T12:00:00`), description: description.trim(), category, bank, direction: kind, amount: numericAmount }, { onSuccess: () => { toast.success("Movimentação salva no banco de dados"); utils.finance.bootstrap.invalidate(); onClose(); }, onError: (error) => toast.error(error.message || "Não foi possível salvar") });
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-start justify-between"><div><p className="eyebrow">novo registro persistente</p><h2>Adicionar movimentação</h2><p className="mt-2 text-sm text-slate-400">Este lançamento ficará salvo no seu fluxo.</p></div><button className="modal-close" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="modal-form"><label>Descrição<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex.: mercado, salário, transferência" /></label><label>Data<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Categoria<select value={category} onChange={(e) => setCategory(e.target.value)}><option>Casa</option><option>Alimentação</option><option>Transferências</option><option>Investimentos</option></select></label><label>Banco<select value={bank} onChange={(e) => setBank(e.target.value)}><option>Inter</option><option>Rico</option><option>PicPay</option><option>Itaú</option></select></label><div className="kind-toggle"><button className={kind === "in" ? "active" : ""} onClick={() => setKind("in")}><ArrowDownLeft className="h-4 w-4" /> Entrada</button><button className={kind === "out" ? "active" : ""} onClick={() => setKind("out")}><ArrowUpRight className="h-4 w-4" /> Saída</button></div><label>Valor<input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$ 0,00" inputMode="decimal" /></label></div><div className="modal-footer"><button className="text-sm text-slate-400 transition hover:text-white" onClick={onClose}>cancelar</button><ActionButton onClick={submit}>{mutation.isPending ? "salvando..." : <><Check className="h-4 w-4" /> salvar {kind === "in" ? "entrada" : "saída"}</>}</ActionButton></div></div></div>;
}

function Sidebar({ active, onChange, person, onPersonChange, profileId }: { active: View; onChange: (view: View) => void; person: Person; onPersonChange: (p: Person) => void; profileId?: number }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.routine.useQuery(profileId ? { profileId, month: "2026-08" } : undefined as never, { enabled: isAuthenticated && !!profileId });
  const overdueCount = data?.overdueBills?.length ?? 0;
  const upcomingCount = data?.upcomingBills?.length ?? 0;
  const alertTitle = overdueCount > 0 ? `${overdueCount} vencimento${overdueCount === 1 ? "" : "s"} atrasado${overdueCount === 1 ? "" : "s"}.` : upcomingCount > 0 ? `${upcomingCount} próximo${upcomingCount === 1 ? "" : "s"} vencimento${upcomingCount === 1 ? "" : "s"}.` : "Nenhum vencimento crítico.";
  const alertDetail = overdueCount > 0 ? "Revise suas contas pendentes." : upcomingCount > 0 ? "O painel acompanha você." : "Tudo sob controle por enquanto.";
  return <aside className="sidebar"><Logo /><div className="sidebar-divider" /><div className="sidebar-period"><p className="eyebrow">período ativo</p><p className="sidebar-month">AGOSTO DE<br />2026</p><p className="sidebar-updated"><span /> atualização diária</p></div><nav className="desktop-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => onChange(id)}><Icon className="h-[18px] w-[18px]" />{label}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><Lightbulb className="h-4 w-4 text-[#d5c486]" /><div><strong>{alertTitle}</strong><span>{alertDetail}</span></div></div><div className="profile-switch"><button className={person === "Felipe" ? "active" : ""} onClick={() => onPersonChange("Felipe")}><span className="avatar avatar-blue small">F</span><span>Felipe</span></button><button className={person === "Sara" ? "active" : ""} onClick={() => onPersonChange("Sara")}><span className="avatar avatar-purple small">S</span><span>Sara</span></button></div></div></aside>;
}

function MobileNav({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  return <nav className="mobile-nav">{navItems.filter(({ id }) => id !== "trash").map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => onChange(id)}><Icon className="h-5 w-5" /><span>{id === "investments" ? "Investir" : id === "overview" ? "Início" : id === "cards" ? "Cartões" : label}</span></button>)}</nav>;
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [active, setActive] = useState<View>("overview");
  const [person, setPerson] = useState<Person>("Felipe");
  const profilesQuery = trpc.finance.profiles.useQuery(undefined, { enabled: isAuthenticated });
  const activeProfileId = profilesQuery.data?.find((profile) => profile.profileKey === person.toLowerCase())?.id;
  const financeQuery = trpc.finance.bootstrap.useQuery({ profileId: activeProfileId }, { enabled: isAuthenticated && !!activeProfileId });
  const [showAdd, setShowAdd] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const content = useMemo(() => {
    if (active === "accounts") return <Accounts profileId={activeProfileId} />;
    if (active === "investments") return <Investments profileId={activeProfileId} />;
    if (active === "cards") return <Cards profileId={activeProfileId} />;
    if (active === "trash") return <Trash profileId={activeProfileId} />;
    if (active === "couple") return <Couple />;
    return <Overview onAdd={() => setShowAdd(true)} profileId={activeProfileId} summary={financeQuery.data?.summary} />;
  }, [active, activeProfileId, financeQuery.data]);
  return <div className={`app-shell ${isLight ? "light-mode" : ""}`}><Sidebar active={active} onChange={setActive} person={person} profileId={activeProfileId} onPersonChange={(next) => { setPerson(next); toast.success(`Fluxo ${next} ativo`); }} /><main className="main-shell"><header className="mobile-header"><button className="header-icon"><Menu className="h-5 w-5" /></button><Logo /><div className="flex items-center gap-2"><button className="header-icon" onClick={() => setIsLight((value) => !value)}><Sun className="h-4 w-4" /></button><button className="header-icon"><Bell className="h-4 w-4" /></button></div></header><div className="desktop-topbar"><div><span className="topbar-status" /><span>{financeQuery.isFetching ? "sincronizando" : isAuthenticated ? "dados persistidos" : "modo demonstração"}</span></div><div className="flex items-center gap-3"><button onClick={() => setIsLight((value) => !value)} className="topbar-link"><Sun className="h-4 w-4" /> modo {isLight ? "escuro" : "claro"}</button><button className="topbar-link"><Settings2 className="h-4 w-4" /> preferências</button>{isAuthenticated ? <button onClick={() => logout()} className="topbar-link">{user?.name ?? "sair"}</button> : <button onClick={() => startLogin()} className="topbar-link">entrar</button>}</div></div><div className="page-content">{content}</div></main><MobileNav active={active} onChange={setActive} /><button className="floating-add" onClick={() => setShowAdd(true)} aria-label="Adicionar movimentação"><Plus className="h-7 w-7" /></button>{showAdd && (isAuthenticated ? <PersistentAddModal onClose={() => setShowAdd(false)} profileId={activeProfileId} /> : <AddModal onClose={() => setShowAdd(false)} />)}</div>;
}
