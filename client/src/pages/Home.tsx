// Fluxo Pessoal — dashboard editorial fintech escuro, com desktop assimétrico e navegação inferior mobile.
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
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
  Archive,
  Moon,
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
import { currentMonthKey, dateKeyFromDate, formatMonthLabel, isDateInMonth, monthOptions as buildMonthOptions, monthStartDate } from "@shared/calendar";

const MARK_URL = "/manus-storage/fluxo-mark_57de0095.png";
const NOISE_URL = "/manus-storage/fluxo-noise_4fec77aa.png";
const ORB_URL = "/manus-storage/sarinha-orb_7340e9b1.png";
const EMPTY_URL = "/manus-storage/finance-empty-state_ec4080db.png";

type View = "overview" | "couple" | "accounts" | "investments" | "cards" | "trash";
type Person = "Felipe" | "Sara" | "Casal";

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

function ActionButton({ children, onClick, variant = "primary", className = "", disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost"; className?: string; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className={`action-btn ${variant === "ghost" ? "action-ghost" : ""} ${className}`}>{children}</button>;
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

function WorkspaceHeader({ active, person, month, onMonthChange, onPersonChange, onAdd, theme, onToggleTheme }: { active: View; person: Person; month: string; onMonthChange: (month: string) => void; onPersonChange: (person: Person) => void; onAdd: () => void; theme: "light" | "dark"; onToggleTheme: () => void }) {
  const pageCopy: Record<View, { title: string; description: string; edit: string }> = {
    overview: { title: "Seu dinheiro, em perspectiva.", description: "Um retrato honesto do seu dinheiro neste mês.", edit: "ajustes da visão" },
    couple: { title: "Resumo geral do casal.", description: "Felipe + Sara em uma única leitura visual.", edit: "ajustes da visão do casal" },
    accounts: { title: "Contas a pagar.", description: "Vencimentos, faturas e pendências em um só lugar.", edit: "ajustes das contas" },
    investments: { title: "Investimentos separados.", description: "Abasteça seus investimentos sem misturar com os lançamentos gerais.", edit: "ajustes dos investimentos" },
    cards: { title: "Cartão de crédito.", description: "Acompanhe faturas, compras internas, parcelas e vencimentos.", edit: "ajustes dos cartões" },
    trash: { title: "Lixeira.", description: "Recupere um registro ou remova tudo de forma permanente.", edit: "ajustes da lixeira" },
  };
  const copy = pageCopy[active];
  const monthLabel = formatMonthLabel(month);
  const availableMonths = buildMonthOptions(month);
  const [editOpen, setEditOpen] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
  return <div className={`workspace-header ${compactHeader ? "compact-header" : ""}`}><div className="workspace-title"><span className="page-kicker">fluxo {person === "Casal" ? "Felipe + Sara" : person} / {monthLabel}</span><h1>{copy.title}</h1><p>{copy.description}</p></div><div className="workspace-tools"><div className="workspace-top-controls"><select aria-label="Selecionar mês" value={month} onChange={(event) => onMonthChange(event.target.value)}>{availableMonths.map((option) => <option key={option} value={option}>{formatMonthLabel(option)}</option>)}</select><div className="profile-pills" aria-label="Selecionar perfil"><button className={person === "Felipe" ? "active profile-felipe" : ""} onClick={() => onPersonChange("Felipe")}><span>F</span> Fluxo Felipe</button><button className={person === "Sara" ? "active profile-sara" : ""} onClick={() => onPersonChange("Sara")}><span>S</span> Fluxo Sara</button><button className={person === "Casal" ? "active profile-casal" : ""} onClick={() => onPersonChange("Casal")}><span>F+S</span> Casal</button></div><span className="header-tool header-currency" aria-label="Moeda atual">R$</span><button className="header-tool" onClick={onToggleTheme} aria-label="Alternar tema">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button></div><div className="workspace-actions"><button className={`edit-context ${editOpen ? "active" : ""}`} onClick={() => setEditOpen((value) => !value)} aria-expanded={editOpen}><Pencil className="h-4 w-4" /> {copy.edit}</button><button className="assistant-pill" onClick={() => toast.success("Sarinha IA: contexto do mês preparado")}>Assistente IA</button><ActionButton onClick={onAdd}><Plus className="h-4 w-4" /> registrar lançamento</ActionButton></div>{editOpen && <div className="header-settings-panel"><p className="eyebrow">ajustes rápidos da visão</p><label><input type="checkbox" checked={compactHeader} onChange={(event) => setCompactHeader(event.target.checked)} /> cabeçalho compacto</label><p>Use esta opção para reduzir o espaço ocupado pelo título quando quiser ver mais dados sem rolar.</p></div>}</div></div>;
}

function WordDayCard({ month }: { month: string }) {
  return <article className="panel word-day-card"><div className="word-day-copy"><p className="eyebrow">palavra do período · {formatMonthLabel(month)}</p><h2>Leitura breve para hoje</h2><p className="word-day-intro">Um lembrete de serenidade para olhar para as escolhas do mês com presença.</p><blockquote>“Para que saibam que só tu, cujo nome é o Senhor, és o Altíssimo sobre toda a terra.”<cite>Salmo 83:18</cite></blockquote></div><div className="word-day-art" aria-hidden="true"><span className="sun-orb" /><span className="hill hill-one" /><span className="hill hill-two" /><span className="sprig sprig-one" /><span className="sprig sprig-two" /></div></article>;
}

function SavingsGoalsCard({ profileId, onAdd, onEdit }: { profileId?: number; onAdd: () => void; onEdit: (item: FinanceFormItem) => void }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const goalsQuery = trpc.finance.savingsGoals.useQuery({ profileId: profileId as number, profileKey: "sara" }, { enabled: isAuthenticated && !!profileId });
  const archiveGoal = trpc.finance.archiveSavingsGoal.useMutation({ onSuccess: () => { utils.finance.savingsGoals.invalidate(); utils.finance.bootstrap.invalidate(); utils.finance.audit.invalidate(); toast.success("Caixinha arquivada"); }, onError: (error) => toast.error(error.message || "Não foi possível arquivar a caixinha") });
  const goals = goalsQuery.data ?? [];
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const archivedGoals = goals.length - activeGoals.length;
  const saved = activeGoals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0);
  const target = activeGoals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0);
  const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const formatGoalDate = (value: Date | null) => value ? new Date(value).toLocaleDateString("pt-BR") : "sem prazo";
  return <article className="panel savings-goals-card"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">visão da sara · dados persistidos</p><h2>Minhas Caixinhas</h2><p className="mt-1 text-sm text-slate-400">Objetivos separados para guardar com intenção.</p></div><button className="goal-add-button" onClick={onAdd}><Plus className="h-4 w-4" /> adicionar</button></div><div className="goal-metrics"><div><span>objetivos ativos</span><strong>{activeGoals.length}</strong></div><div><span>valor guardado</span><strong>{formatMoney(saved)}</strong></div><div><span>progresso geral</span><strong>{activeGoals.length ? `${progress.toFixed(0)}%` : "—"}</strong></div></div>{activeGoals.length ? <div className="goal-list">{activeGoals.map((goal) => { const goalProgress = Math.min(100, Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0); return <article className="goal-row" key={goal.id}><div className="goal-row-top"><div><strong>{goal.name}</strong><span>{goal.category} · {formatGoalDate(goal.targetDate)}</span></div><div className="goal-row-actions"><button className="square-btn" onClick={() => onEdit(goal)} aria-label={`Editar ${goal.name}`}><Pencil className="h-3.5 w-3.5" /></button><button className="square-btn" onClick={() => archiveGoal.mutate({ id: goal.id })} disabled={archiveGoal.isPending} aria-label={`Arquivar ${goal.name}`}><Receipt className="h-3.5 w-3.5" /></button></div></div><div className="goal-progress-track"><span style={{ width: `${goalProgress}%` }} /></div><div className="goal-row-bottom"><span>{formatMoney(Number(goal.currentAmount))} de {formatMoney(Number(goal.targetAmount))}</span><strong>{goalProgress.toFixed(0)}%</strong></div></article>; })}</div> : <div className="goal-empty"><div className="goal-orb">✦</div><div><strong>Nenhuma caixinha cadastrada</strong><p>Crie um objetivo como reserva ou viagem para acompanhar seu progresso. Os valores só aparecem depois do cadastro.</p></div></div>}{archivedGoals > 0 && <p className="goal-archived-note">{archivedGoals} objetivo(s) arquivado(s) permanecem no histórico.</p>}</article>;
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

function CommitmentCard({ commitment = 0, income = 0, expenses = 0, billsPending = 0, cardInstallments = 0 }: { commitment?: number; income?: number; expenses?: number; billsPending?: number; cardInstallments?: number }) {
  const normalized = Math.max(0, commitment);
  const denominator = income > 0 ? income : 0;
  const expensesShare = denominator ? (expenses / denominator) * 100 : 0;
  const accountsShare = denominator ? (billsPending / denominator) * 100 : 0;
  const cardsShare = denominator ? (cardInstallments / denominator) * 100 : 0;
  const rawTotal = expensesShare + accountsShare + cardsShare;
  const trackScale = rawTotal > 100 ? 100 / rawTotal : 1;
  return (
    <article className="panel commitment-panel">
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">comprometimento da receita</p><h2>O dinheiro está encontrando destino.</h2></div><span className="trend-pill">{normalized > 0 ? "acompanhamento ativo" : "sem dados"}</span></div>
      <div className="commitment-track"><span style={{ width: `${expensesShare * trackScale}%` }} /><span style={{ width: `${accountsShare * trackScale}%` }} /><span style={{ width: `${cardsShare * trackScale}%` }} /></div>
      <div className="grid grid-cols-3 gap-3 pt-4"><div><p className="text-xs text-slate-500">Saídas</p><p className="mt-1 text-sm font-semibold">{expensesShare.toFixed(0)}%</p></div><div><p className="text-xs text-slate-500">Contas</p><p className="mt-1 text-sm font-semibold">{accountsShare.toFixed(0)}%</p></div><div><p className="text-xs text-slate-500">Cartões</p><p className="mt-1 text-sm font-semibold">{cardsShare.toFixed(0)}%</p></div></div>
    </article>
  );
}

function DaySummary({ month, summary }: { month: string; summary?: { income: number; expenses: number } }) {
  return <article className="panel day-panel"><div className="flex items-center gap-3"><div className="icon-tile mint"><CalendarDays className="h-5 w-5" /></div><div><p className="eyebrow">resumo do período</p><h2>{formatMonthLabel(month)}</h2></div></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="mini-stat"><p>Entradas</p><strong>{formatMoney(summary?.income ?? 0)}</strong></div><div className="mini-stat"><p>Saídas</p><strong className="text-[#e4b7aa]">{formatMoney(summary?.expenses ?? 0)}</strong></div></div><button onClick={() => toast.info(`Detalhes de ${formatMonthLabel(month)}`)} className="inline-link mt-5">Ver detalhes <ChevronRight className="h-4 w-4" /></button></article>;
}

function TransactionsCard({ onAdd }: { onAdd: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = transactions.filter((item) => `${item.name} ${item.category} ${item.bank}`.toLowerCase().includes(query.toLowerCase()));
  return <article className="panel transactions-panel"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">alimentação diária</p><h2>Lançamentos do dia a dia</h2><p className="mt-2 text-sm text-slate-400">Adicione uma linha por vez. O fluxo ativo é <strong className="text-slate-200">Felipe</strong>.</p></div><span className="profile-chip">FLUXO FELIPE</span></div><div className="mt-6 flex flex-wrap gap-3"><label className="search-wrap flex-1"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="buscar descrição, categoria ou banco" /></label><ActionButton onClick={onAdd}><Plus className="h-4 w-4" /> adicionar</ActionButton><ActionButton variant="ghost" onClick={() => toast.success("CSV preparado para exportação") }><Download className="h-4 w-4" /> CSV</ActionButton></div><p className="mt-5 text-xs text-slate-500">{filtered.length} lançamentos visíveis no mês</p><div className="transaction-list">{filtered.map((item) => <div className="transaction-row" key={`${item.day}-${item.name}`}><div className={`icon-tile ${item.color}`}><item.icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-200">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.day} · {item.category} · {item.bank}</p></div><div className="text-right"><p className={`font-semibold ${item.kind === "Entrada" ? "text-[#a8d7c2]" : "text-[#e2b5aa]"}`}>{item.kind === "Entrada" ? "+" : "-"}{item.value}</p><button className="edit-link" onClick={() => toast.info(`Editando ${item.name}`)}><Edit3 className="h-3 w-3" /> editar</button></div></div>)}</div></article>;
}

function formatMoney(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function serializeCardPurchasesCsv(rows: Array<{ cardId: number; description: string; category: string; purchaseDate: Date; totalAmount: string | number; installmentAmount: string | number; installments: number; currentInstallment: number }>, cards: Array<{ id: number; name: string }>) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const header = ["cartao", "descricao", "categoria", "data", "valor_total", "parcela_mes", "parcelas", "parcela_atual"].join(",");
  const lines = rows.map((row) => [cards.find((card) => card.id === row.cardId)?.name ?? "", row.description, row.category, new Date(row.purchaseDate).toISOString().slice(0, 10), Number(row.totalAmount).toFixed(2), Number(row.installmentAmount).toFixed(2), row.installments, row.currentInstallment].map(escape).join(","));
  return [header, ...lines].join("\\n");
}
function resolveBillStatus(status: "pending" | "paid" | "late", dueDate: Date) { return status === "paid" ? "paid" : new Date(dueDate).getTime() < Date.now() ? "late" : "pending"; }

function CategoriesManager({ profileId, onClose }: { profileId?: number; onClose: () => void }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const categoriesQuery = trpc.finance.categories.useQuery({ profileId: profileId as number }, { enabled: isAuthenticated && !!profileId });
  const createCategory = trpc.finance.createCategory.useMutation();
  const updateCategory = trpc.finance.updateCategory.useMutation();
  const archiveCategory = trpc.finance.archiveCategory.useMutation();
  const deleteCategory = trpc.finance.deleteCategory.useMutation();
  const [direction, setDirection] = useState<"in" | "out">("out");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const categories = categoriesQuery.data ?? [];
  const busy = createCategory.isPending || updateCategory.isPending || archiveCategory.isPending || deleteCategory.isPending;
  const refresh = () => { utils.finance.categories.invalidate(); utils.finance.bootstrap.invalidate(); utils.finance.audit.invalidate(); };
  const submit = () => {
    if (!profileId) { toast.error("Faça login para configurar categorias"); return; }
    if (!name.trim()) { toast.error("Informe o nome da categoria"); return; }
    createCategory.mutate({ profileId, name: name.trim(), direction }, { onSuccess: () => { refresh(); setName(""); toast.success("Categoria criada"); }, onError: (error) => toast.error(error.message || "Não foi possível criar a categoria") });
  };
  const rename = (id: number) => {
    if (!editingName.trim()) { toast.error("Informe um nome válido"); return; }
    updateCategory.mutate({ id, name: editingName.trim() }, { onSuccess: () => { refresh(); setEditingId(null); setEditingName(""); toast.success("Categoria renomeada"); }, onError: (error) => toast.error(error.message || "Não foi possível renomear a categoria") });
  };
  const archive = (id: number) => archiveCategory.mutate({ id }, { onSuccess: () => { refresh(); toast.success("Categoria arquivada"); }, onError: (error) => toast.error(error.message || "Não foi possível arquivar a categoria") });
  const remove = (id: number) => {
    if (!window.confirm("Excluir esta categoria? Se ela já estiver em uso, será necessário arquivá-la para preservar o histórico.")) return;
    deleteCategory.mutate({ id }, { onSuccess: () => { refresh(); toast.success("Categoria excluída"); }, onError: (error) => toast.error(error.message || "Não foi possível excluir a categoria") });
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card categories-modal" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">configuração do fluxo</p><h2>Categorias de entradas e saídas</h2><p className="mt-2 text-sm text-slate-400">As categorias ficam vinculadas ao perfil ativo e aparecem nos formulários e filtros.</p></div><button className="modal-close" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button></div><div className="category-create-row"><select value={direction} onChange={(event) => setDirection(event.target.value as "in" | "out")}><option value="out">Saída</option><option value="in">Entrada</option></select><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="Nome da nova categoria" /><ActionButton onClick={submit} disabled={busy}><Plus className="h-4 w-4" /> adicionar</ActionButton></div><div className="category-groups"><section><div className="category-group-head"><p className="eyebrow">saídas</p><span>{categories.filter((category) => category.direction === "out" && category.status === "active").length} ativas</span></div>{categories.filter((category) => category.direction === "out").map((category) => <div className={`category-row ${category.status === "archived" ? "archived" : ""}`} key={category.id}>{editingId === category.id ? <input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") rename(category.id); if (event.key === "Escape") setEditingId(null); }} /> : <span>{category.name}</span>}<div className="category-actions">{editingId === category.id ? <button className="edit-link" onClick={() => rename(category.id)}>salvar</button> : <button className="square-btn" onClick={() => { setEditingId(category.id); setEditingName(category.name); }} aria-label={`Renomear ${category.name}`}><Pencil className="h-3.5 w-3.5" /></button>}{category.status === "active" && <button className="square-btn" onClick={() => archive(category.id)} disabled={busy} aria-label={`Arquivar ${category.name}`}><Archive className="h-3.5 w-3.5" /></button>}<button className="square-btn danger" onClick={() => remove(category.id)} disabled={busy} aria-label={`Excluir ${category.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div>)}{!categories.some((category) => category.direction === "out") && <p className="empty-inline">Nenhuma categoria de saída cadastrada.</p>}</section><section><div className="category-group-head"><p className="eyebrow">entradas</p><span>{categories.filter((category) => category.direction === "in" && category.status === "active").length} ativas</span></div>{categories.filter((category) => category.direction === "in").map((category) => <div className={`category-row ${category.status === "archived" ? "archived" : ""}`} key={category.id}>{editingId === category.id ? <input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") rename(category.id); if (event.key === "Escape") setEditingId(null); }} /> : <span>{category.name}</span>}<div className="category-actions">{editingId === category.id ? <button className="edit-link" onClick={() => rename(category.id)}>salvar</button> : <button className="square-btn" onClick={() => { setEditingId(category.id); setEditingName(category.name); }} aria-label={`Renomear ${category.name}`}><Pencil className="h-3.5 w-3.5" /></button>}{category.status === "active" && <button className="square-btn" onClick={() => archive(category.id)} disabled={busy} aria-label={`Arquivar ${category.name}`}><Archive className="h-3.5 w-3.5" /></button>}<button className="square-btn danger" onClick={() => remove(category.id)} disabled={busy} aria-label={`Excluir ${category.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div>)}{!categories.some((category) => category.direction === "in") && <p className="empty-inline">Nenhuma categoria de entrada cadastrada.</p>}</section></div><div className="modal-footer"><span className="text-xs text-slate-500">Categorias em uso não são apagadas: arquive-as para preservar o histórico.</span><button className="text-sm text-slate-400 transition hover:text-white" onClick={onClose}>fechar</button></div></div></div>;
}

function LiveTransactionsCard({ onAdd, onEdit, onDelete, profileId, onManageCategories, globalMonth }: { onAdd: () => void; onEdit?: (item: any) => void; onDelete?: (item: any) => void; profileId?: number; onManageCategories?: () => void; globalMonth: string }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.transactions.useQuery({ profileId }, { enabled: isAuthenticated && !!profileId });
  const { data: configuredCategories = [] } = trpc.finance.categories.useQuery({ profileId: profileId as number }, { enabled: isAuthenticated && !!profileId });
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(globalMonth);
  useEffect(() => setMonth(globalMonth), [globalMonth]);
  const [bank, setBank] = useState("");
  const [category, setCategory] = useState("");
  const [direction, setDirection] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: any } | null>(null);
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => { window.removeEventListener("click", close); window.removeEventListener("scroll", close, true); };
  }, [contextMenu]);
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
  const filtered = source.filter((item) => { const matchesText = `${item.description} ${item.category} ${item.bank}`.toLowerCase().includes(query.toLowerCase()); const matchesMonth = isDateInMonth(item.date, month); const matchesBank = !bank || item.bank === bank; const matchesCategory = !category || item.category === category; const matchesDirection = !direction || item.direction === direction; return matchesText && matchesMonth && matchesBank && matchesCategory && matchesDirection; });
  const months = Array.from(new Set([globalMonth, ...source.map((item) => dateKeyFromDate(item.date).slice(0, 7))])).sort().reverse();
  const banks = Array.from(new Set(source.map((item) => item.bank)));
  const categories = Array.from(new Set([...source.map((item) => item.category), ...configuredCategories.filter((item) => item.status === "active").map((item) => item.name)]));
  return <article className="panel transactions-panel"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">alimentação diária</p><h2>Lançamentos persistidos</h2><p className="mt-2 text-sm text-slate-400">A lista agora é alimentada pelo banco de dados. Clique com o botão direito em uma linha para editar, excluir ou configurar categorias.</p></div><span className="profile-chip">{filtered.length} REGISTROS</span></div><div className="mt-6 flex flex-wrap gap-3"><label className="search-wrap flex-1"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="buscar descrição, categoria ou banco" /></label><select className="select-field" value={month} onChange={(e) => setMonth(e.target.value)}>{months.map((item) => <option key={item} value={item}>{formatMonthLabel(item)}</option>)}</select><select className="select-field" value={bank} onChange={(e) => setBank(e.target.value)}><option value="">Todos os bancos</option>{banks.map((item) => <option key={item} value={item}>{item}</option>)}</select><select className="select-field" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Todas as categorias</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><select className="select-field" value={direction} onChange={(e) => setDirection(e.target.value)}><option value="">Entradas e saídas</option><option value="in">Entradas</option><option value="out">Saídas</option></select><ActionButton onClick={onAdd}><Plus className="h-4 w-4" /> adicionar</ActionButton><ActionButton variant="ghost" onClick={onManageCategories}><Settings2 className="h-4 w-4" /> categorias</ActionButton><input ref={fileInputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImport(file); event.target.value = ""; }} /><ActionButton variant="ghost" onClick={() => { if (!importMutation.isPending) fileInputRef.current?.click(); }}><FileSpreadsheet className="h-4 w-4" /> {importMutation.isPending ? "importando..." : "importar CSV"}</ActionButton><ActionButton variant="ghost" onClick={() => { const csv = serializeFinanceCsv(filtered.map((item) => ({ date: dateKeyFromDate(item.date), description: item.description, category: item.category, bank: item.bank, direction: item.direction, amount: Number(item.amount) }))); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "fluxo-lancamentos.csv"; link.click(); URL.revokeObjectURL(url); toast.success("CSV exportado") }}><Download className="h-4 w-4" /> exportar CSV</ActionButton></div>{importReport && <div className="import-report"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">relatório da importação</p><h3>{importReport.created} importado(s) · {importReport.skipped} duplicado(s) · {importReport.rejected.length} rejeitado(s)</h3><p className="mt-1 text-xs text-slate-500">{importReport.total} linha(s) processada(s). Verifique os detalhes antes de corrigir o arquivo.</p></div><button className="edit-link" onClick={() => setImportReport(null)}><X className="h-3 w-3" /> fechar</button></div>{importReport.rejected.length > 0 && <div className="import-errors">{importReport.rejected.map((item) => <div key={`${item.line}-${item.reason}`}><strong>Linha {item.line}</strong><span>{item.reason}</span><code>{item.raw}</code></div>)}</div>}</div>}<div className="transaction-list">{filtered.length === 0 ? <div className="empty-state"><img src={EMPTY_URL} alt="" /><h2>Nenhum lançamento encontrado.</h2><p>Adicione um registro ou ajuste a busca.</p></div> : filtered.map((item) => <div className="transaction-row" key={item.id} tabIndex={0} onContextMenu={(event) => { event.preventDefault(); setContextMenu({ x: event.clientX, y: event.clientY, item }); }}><div className={`icon-tile ${item.direction === "in" ? "mint" : "clay"}`}><CircleDollarSign className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-200">{item.description}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.date).toLocaleDateString("pt-BR")} · {item.category} · {item.bank}</p></div><p className={`font-semibold ${item.direction === "in" ? "text-[#a8d7c2]" : "text-[#e2b5aa]"}`}>{item.direction === "in" ? "+" : "-"}{formatMoney(Number(item.amount))}</p><button className="edit-link" onClick={() => onEdit?.(item)}><Pencil className="h-3 w-3" /> editar</button></div>)}</div>{contextMenu && <div className="transaction-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onMouseDown={(event) => event.stopPropagation()}><button onClick={() => { onEdit?.(contextMenu.item); setContextMenu(null); }}><Pencil className="h-4 w-4" /> editar lançamento</button><button onClick={() => { onManageCategories?.(); setContextMenu(null); }}><Settings2 className="h-4 w-4" /> configurar categorias</button><button className="danger" onClick={() => { onDelete?.(contextMenu.item); setContextMenu(null); }}><Trash2 className="h-4 w-4" /> excluir lançamento</button></div>}</article>;
}

function RoutineCard({ profileId, month = currentMonthKey() }: { profileId?: number; month?: string }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.routine.useQuery(profileId ? { profileId, month } : undefined as never, { enabled: isAuthenticated && !!profileId });
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

function Overview({ onAdd, onAddBill, onAddInvestment, onAddCard, onEdit, onDelete, onManageCategories, profileId, month = currentMonthKey(), summary }: { onAdd: () => void; onAddBill?: () => void; onAddInvestment?: () => void; onAddCard?: () => void; onEdit: (item: any) => void; profileId?: number; month?: string; summary?: { balance: number; income: number; expenses: number; invested: number; commitment: number; billsPending?: number; cardInstallments?: number; series?: Array<{ date: string; income: number; expenses: number }> }; onDelete?: (item: any) => void; onManageCategories?: () => void }) {
  const investmentShare = summary?.income && summary.income > 0 ? (summary.invested / summary.income) * 100 : 0;
  return <div className="space-y-5"><div className="flow-quick-actions"><div><p className="eyebrow">fluxos separados</p><p className="flow-quick-copy">Cada tipo de movimento tem seu próprio cadastro, cálculo e histórico.</p></div><div className="flow-quick-buttons"><button onClick={onAdd}><ArrowUpRight className="h-4 w-4" /> lançamento</button><button onClick={onAddBill}><Receipt className="h-4 w-4" /> conta</button><button onClick={onAddInvestment}><TrendingUp className="h-4 w-4" /> investimento</button><button onClick={onAddCard}><CreditCard className="h-4 w-4" /> cartão</button></div></div><div className="stats-grid"><StatCard label="Saldo do mês" value={formatMoney(summary?.balance ?? 0)} detail="entradas menos saídas do período" tone="blue" icon={CircleDollarSign} /><StatCard label="Total de entradas" value={formatMoney(summary?.income ?? 0)} detail="receitas registradas no mês" tone="mint" icon={ArrowDownLeft} /><StatCard label="Total de saídas" value={formatMoney(summary?.expenses ?? 0)} detail="despesas registradas no mês" tone="clay" icon={ArrowUpRight} /><StatCard label="Comprometido" value={`${(summary?.commitment ?? 0).toFixed(1)}%`} detail="atenção quando passa de 70%" tone="gold" icon={TrendingUp} /></div><div className="content-grid"><ChartCard series={summary?.series} /><CommitmentCard commitment={summary?.commitment} income={summary?.income} expenses={summary?.expenses} billsPending={summary?.billsPending} cardInstallments={summary?.cardInstallments} /><DaySummary month={month} summary={summary} /><RoutineCard profileId={profileId} month={month} /><aside className="assistant-card"><div className="assistant-orb"><img src={ORB_URL} alt="" /></div><div><p className="eyebrow">sarinha ia</p><h2>Um olhar para o seu mês</h2><p className="mt-2 text-sm leading-6 text-slate-400">{investmentShare > 0 ? `Você está direcionando ${investmentShare.toFixed(1)}% da receita para investimentos neste período.` : "Ainda não há aportes registrados neste período."}</p></div><button onClick={() => toast.success("Sarinha IA: análise adicionada ao seu resumo") } className="assistant-action">Conversar com a Sarinha <ChevronRight className="h-4 w-4" /></button></aside><WordDayCard month={month} /></div><LiveTransactionsCard onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} onManageCategories={onManageCategories} profileId={profileId} globalMonth={month} /><GovernanceCard profileId={profileId} /></div>;
}

type FilterValues = { month?: string; bank?: string; category?: string; cardId?: string };

function FilterBar({ type, values = {}, onChange, cardOptions = [], categoryOptions = [] }: { type: "accounts" | "investments" | "cards"; values?: FilterValues; onChange?: (values: FilterValues) => void; cardOptions?: Array<{ id: number; name: string }>; categoryOptions?: string[] }) {
  const set = (key: keyof FilterValues, value: string) => onChange?.({ ...values, [key]: value || undefined });
  const selectedMonth = values.month ?? currentMonthKey();
  return <div className="filter-bar"><div className="filter-title"><Filter className="h-4 w-4 text-[#8aa9c1]" /><span>filtrar visão</span></div><select className="select-field" value={selectedMonth} onChange={(event) => set("month", event.target.value)}>{buildMonthOptions(selectedMonth).map((option) => <option key={option} value={option}>{formatMonthLabel(option)}</option>)}</select>{type === "investments" && <select className="select-field" value={values.bank ?? ""} onChange={(event) => set("bank", event.target.value)}><option value="">Todos os bancos</option><option value="Inter">Inter</option><option value="Rico">Rico</option><option value="PicPay">PicPay</option></select>}{type === "cards" && <select className="select-field" value={values.cardId ?? ""} onChange={(event) => set("cardId", event.target.value)}><option value="">Todos os cartões</option>{cardOptions.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select>}{type !== "accounts" && <select className="select-field" value={values.category ?? ""} onChange={(event) => set("category", event.target.value)}><option value="">Todas as categorias</option>{(categoryOptions.length ? categoryOptions : ["Renda fixa", "Casa", "Alimentação"]).map((category) => <option key={category} value={category}>{category}</option>)}</select>}{(type === "accounts" || type === "investments") && <ActionButton variant="ghost" onClick={() => toast.success("CSV preparado para exportação")}><Download className="h-4 w-4" /> exportar CSV</ActionButton>}</div>;
}

function Accounts({ profileId, month = currentMonthKey(), onAdd, onEdit }: { profileId?: number; month?: string; onAdd: () => void; onEdit: (item: any) => void }) {
  const { isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const effectiveMonth = monthFilter || month;
  useEffect(() => setMonthFilter(""), [month]);
  const { data } = trpc.finance.bootstrap.useQuery({ profileId, month: effectiveMonth }, { enabled: isAuthenticated && !!profileId });
  const bills = data?.bills ?? [];
  const markPaid = trpc.finance.markBillPaid.useMutation();
  const utils = trpc.useUtils();
  const monthBills = bills.filter((bill) => isDateInMonth(bill.dueDate, effectiveMonth));
  const visibleBills = monthBills.filter((bill) => !statusFilter || resolveBillStatus(bill.status, bill.dueDate) === statusFilter);
  const pending = monthBills.filter((bill) => resolveBillStatus(bill.status, bill.dueDate) === "pending");
  const paid = monthBills.filter((bill) => resolveBillStatus(bill.status, bill.dueDate) === "paid");
  const late = monthBills.filter((bill) => resolveBillStatus(bill.status, bill.dueDate) === "late");
  return <div className="space-y-5"><SectionHeader eyebrow={`contas do mês · ${formatMonthLabel(effectiveMonth)}`} title="Contas a pagar" subtitle="Um lugar claro para acompanhar os compromissos que não podem escapar." actions={<ActionButton onClick={onAdd}><Plus className="h-4 w-4" /> adicionar conta</ActionButton>} /><div className="account-toolbar"><span className="profile-chip">{monthBills.length} CONTAS</span><select className="select-field" value={effectiveMonth} onChange={(event) => setMonthFilter(event.target.value)}>{buildMonthOptions(effectiveMonth).map((option) => <option key={option} value={option}>{formatMonthLabel(option)}</option>)}</select><select className="select-field w-56" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todas</option><option value="pending">Pendentes</option><option value="paid">Pagas</option><option value="late">Atrasadas</option></select></div><div className="stats-grid three"><StatCard label="Vencimentos" value={String(monthBills.length)} detail={`em ${formatMonthLabel(effectiveMonth)}`} tone="gold" icon={CalendarDays} /><StatCard label="Pendentes" value={String(pending.length)} detail="aguardando pagamento" tone="clay" icon={Bell} /><StatCard label="Pagas" value={String(paid.length)} detail="até o momento" tone="mint" icon={Check} /><StatCard label="Atrasadas" value={String(late.length)} detail="exigem atenção" tone="clay" icon={Bell} /></div><article className="panel bills-panel"><div className="list-head"><span className="checkbox" /><span>selecionar contas</span><span className="ml-auto text-xs uppercase tracking-[.14em] text-slate-500">status</span></div>{visibleBills.length ? visibleBills.map((bill) => <div className="bill-row" key={bill.id}><span className="checkbox" /><div className="icon-tile gold"><CalendarDays className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-200">{bill.description}</p><p className="mt-1 text-xs text-slate-500">Vencimento: {new Date(bill.dueDate).toLocaleDateString("pt-BR")} · Responsável: {bill.responsible}</p></div><strong>{formatMoney(Number(bill.amount))}</strong><button className="square-btn" onClick={() => onEdit(bill)} aria-label="Editar conta"><Pencil className="h-4 w-4" /></button><span className={`status ${resolveBillStatus(bill.status, bill.dueDate) === "paid" ? "paid" : resolveBillStatus(bill.status, bill.dueDate) === "late" ? "late" : "pending"}`}>{resolveBillStatus(bill.status, bill.dueDate) === "paid" ? "Paga" : resolveBillStatus(bill.status, bill.dueDate) === "late" ? "Atrasada" : "Pendente"}</span><button className="square-btn" onClick={() => { markPaid.mutate({ id: bill.id, paid: bill.status !== "paid" }, { onSuccess: () => { utils.finance.bootstrap.invalidate(); utils.finance.routine.invalidate(); utils.finance.couple.invalidate(); toast.success(bill.status === "paid" ? "Conta reaberta" : "Conta marcada como paga"); }, onError: () => toast.error("Não foi possível atualizar a conta") }); }} aria-label={bill.status === "paid" ? "Reabrir conta" : "Marcar conta como paga"}>{bill.status === "paid" ? <Receipt className="h-4 w-4" /> : <Check className="h-4 w-4" />}</button></div>) : <div className="empty-state"><h2>Nenhuma conta cadastrada.</h2><p>Adicione sua primeira conta para acompanhar vencimentos.</p></div>}</article></div>;
}

function Investments({ profileId, month = currentMonthKey(), person, onAdd, onEdit, onAddGoal, onEditGoal }: { profileId?: number; month?: string; person?: Person; onAdd: () => void; onEdit: (item: any) => void; onAddGoal: () => void; onEditGoal: (item: FinanceFormItem) => void }) {
  const { isAuthenticated } = useAuth();
  const [monthFilter, setMonthFilter] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const effectiveMonth = monthFilter || month;
  useEffect(() => setMonthFilter(""), [month]);
  const { data } = trpc.finance.bootstrap.useQuery({ profileId, month: effectiveMonth }, { enabled: isAuthenticated && !!profileId });
  const allRows = data?.investments ?? [];
  const isSara = person === "Sara" || data?.profiles.find((profile) => profile.id === profileId)?.profileKey === "sara";
  const rows = allRows.filter((item) => (!bankFilter || item.institution === bankFilter) && (!categoryFilter || item.category === categoryFilter));
  const invested = rows.reduce((sum, item) => sum + Number(item.investedAmount), 0);
  const market = rows.reduce((sum, item) => sum + Number(item.marketValue), 0);
  return <div className="space-y-5"><SectionHeader eyebrow="patrimônio do fluxo felipe" title="Investimentos" actions={<><ActionButton variant="ghost" onClick={() => toast.info("Use editar na tabela para alterar um investimento")}><Pencil className="h-4 w-4" /></ActionButton><ActionButton onClick={onAdd}><Plus className="h-4 w-4" /> novo investimento</ActionButton></>} />{isSara && <SavingsGoalsCard profileId={profileId} onAdd={() => onAddGoal()} onEdit={(item) => onEditGoal(item)} />}<FilterBar type="investments" values={{ month: effectiveMonth, bank: bankFilter, category: categoryFilter }} onChange={(next) => { setMonthFilter(next.month ?? ""); setBankFilter(next.bank ?? ""); setCategoryFilter(next.category ?? ""); }} /><div className="stats-grid four"><StatCard label="Total investido" value={formatMoney(invested)} tone="blue" /><StatCard label="Valor de mercado" value={formatMoney(market)} tone="mint" /><StatCard label="Resultado" value={formatMoney(rows.length ? market - invested : 0)} tone="gold" /><StatCard label="Última atualização" value={rows[0] ? new Date(rows[0].investedAt).toLocaleDateString("pt-BR") : "sem dados"} tone="clay" /></div><div className="institution-strip"><p className="eyebrow">saldo por instituição</p><div className="flex flex-wrap gap-8">{rows.length ? Array.from(new Set(rows.map((item) => item.institution))).map((institution) => <span key={institution}>{institution} <strong>{formatMoney(rows.filter((item) => item.institution === institution).reduce((sum, item) => sum + Number(item.marketValue), 0))}</strong></span>) : <span>Cadastre seu primeiro investimento para acompanhar por instituição.</span>}</div></div><article className="panel table-panel"><div className="data-table desktop-table"><div className="table-row table-header"><span className="checkbox" /><span>descrição</span><span>categoria</span><span>instituição ↑</span><span>data ↑</span><span className="text-right">valor ↓</span><span /></div>{rows.length ? rows.map((item, index) => <div className={`table-row ${index % 2 ? "selected-row" : ""}`} key={item.id}><span className="checkbox" /><strong>{item.description}</strong><span>{item.category}</span><span>{item.institution}</span><span>{new Date(item.investedAt).toLocaleDateString("pt-BR")}</span><strong className="text-right">{formatMoney(Number(item.marketValue))}</strong><button className="square-btn" onClick={() => onEdit(item)} aria-label={`Editar ${item.description}`}><Pencil className="h-4 w-4" /></button></div>) : <div className="empty-state"><h2>Nenhum investimento cadastrado.</h2><p>Adicione um investimento para acompanhar seu patrimônio.</p></div>}</div><div className="mobile-investments">{rows.map((item) => <div className="mobile-investment-row" key={`${item.id}-mobile`}><div><p className="font-semibold text-slate-200">{item.description}</p><p className="mt-1 text-xs text-slate-500">{item.category} · {item.institution} · {new Date(item.investedAt).toLocaleDateString("pt-BR")}</p></div><strong>{formatMoney(Number(item.marketValue))}</strong></div>)}</div></article></div>;
}

function Cards({ profileId, month = currentMonthKey(), onAddCard, onAddPurchase, onEditCard, onEditPurchase }: { profileId?: number; month?: string; onAddCard: () => void; onAddPurchase: () => void; onEditCard: (item: any) => void; onEditPurchase: (item: any) => void }) {
  const { isAuthenticated } = useAuth();
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>();
  const [cardMonth, setCardMonth] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const activeCardMonth = cardMonth || month;
  useEffect(() => setCardMonth(""), [month]);
  const { data } = trpc.finance.bootstrap.useQuery({ profileId, month: activeCardMonth }, { enabled: isAuthenticated && !!profileId });
  const cardInstallments = data?.summary.cardInstallments ?? 0;
  const cardTotal = data?.summary.cardTotal ?? 0;
  const purchaseRows = data?.purchases ?? [];
  const cards = data?.cards ?? [];
  const statementMonthDate = monthStartDate(activeCardMonth);
  const statementMonthLabel = formatMonthLabel(activeCardMonth);
  const statementDueDate = (dueDay: number) => { const dueDate = new Date(statementMonthDate); dueDate.setUTCMonth(dueDate.getUTCMonth() + 1); const lastDay = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth() + 1, 0, 12)).getUTCDate(); dueDate.setUTCDate(Math.min(dueDay, lastDay)); return dueDate.toLocaleDateString("pt-BR"); };
  const [showTotal, setShowTotal] = useState(false);
  const [onlyInstallments, setOnlyInstallments] = useState(false);
  const cardCategories = Array.from(new Set(purchaseRows.map((item) => item.category)));
  const visiblePurchases = purchaseRows.filter((item) => (!activeCardMonth || isDateInMonth(item.purchaseDate, activeCardMonth)) && (!selectedCardId || item.cardId === selectedCardId) && (!categoryFilter || item.category === categoryFilter) && (!onlyInstallments || item.installments > 1));
  const visibleInstallments = visiblePurchases.reduce((sum, item) => sum + Number(item.installmentAmount), 0);
  const visibleTotal = visiblePurchases.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const cardStatements = data?.summary.cardStatements ?? [];
  return <div className="space-y-5"><SectionHeader eyebrow={`controle separado · ${statementMonthLabel}`} title="Cartão de crédito" actions={<><ActionButton variant="ghost" onClick={() => { const selected = cards.find((card) => card.id === selectedCardId) ?? cards[0]; if (selected) onEditCard(selected); else toast.info("Cadastre um cartão antes de editar"); }}><Pencil className="h-4 w-4" /> editar cartão</ActionButton><ActionButton variant="ghost" onClick={onAddCard}><Plus className="h-4 w-4" /> novo cartão</ActionButton><ActionButton onClick={onAddPurchase}><Plus className="h-4 w-4" /> cadastrar e salvar fatura</ActionButton></>} /><FilterBar type="cards" cardOptions={cards} categoryOptions={cardCategories} values={{ month: activeCardMonth, cardId: selectedCardId?.toString(), category: categoryFilter }} onChange={(next) => { setCardMonth(next.month ?? ""); setSelectedCardId(next.cardId ? Number(next.cardId) : undefined); setCategoryFilter(next.category ?? ""); }} /><div className="segmented"><span>Mostrar compras por</span><button className={!showTotal ? "active" : ""} onClick={() => setShowTotal(false)}>Parcela do mês</button><button className={showTotal ? "active" : ""} onClick={() => setShowTotal(true)}>Valor total</button></div><div className="segmented"><span>Exibir</span><button className={!onlyInstallments ? "active" : ""} onClick={() => setOnlyInstallments(false)}>Todas</button><button className={onlyInstallments ? "active" : ""} onClick={() => setOnlyInstallments(true)}>Só parceladas do mês</button></div><ActionButton onClick={() => { const csv = serializeCardPurchasesCsv(visiblePurchases, cards); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "fluxo-faturas.csv"; link.click(); URL.revokeObjectURL(url); toast.success("CSV de faturas exportado"); }}><Download className="h-4 w-4" /> exportar CSV</ActionButton><article className="panel card-statement"><div className="statement-head"><span className="checkbox" /><span>Cartão <span className="sort-badge">↕</span></span><span>Mês <span className="sort-badge">↕</span></span><span>Vencimento</span><span className="text-right">Valor</span></div>{cards.length ? cards.map((card) => { const cardPurchases = visiblePurchases.filter((item) => item.cardId === card.id); const statement = cardStatements.find((item) => item.cardId === card.id); const cardValue = statement ? (showTotal ? statement.totalAmount : statement.installmentAmount) : cardPurchases.reduce((sum, item) => sum + Number(showTotal ? item.totalAmount : item.installmentAmount), 0); return <button className={`statement-row text-left ${selectedCardId === card.id ? "selected-row" : ""}`} key={card.id} onClick={() => setSelectedCardId(selectedCardId === card.id ? undefined : card.id)}><span className="checkbox" /><span>{card.name}</span><span>{statementMonthLabel}</span><span>{statementDueDate(card.dueDay)}</span><strong className="text-right">{formatMoney(cardValue)}</strong></button>; }) : <div className="empty-state"><h2>Nenhum cartão cadastrado.</h2><p>Cadastre um cartão para controlar suas faturas.</p></div>}<div className="statement-total"><div><p className="eyebrow">fechamento por cartão · vencimento no mês seguinte</p><h2>Fatura de {statementMonthLabel}</h2><p className="mt-2 text-sm text-slate-400">{visiblePurchases.length} compras internas · {visiblePurchases.length ? "em aberto" : "sem compras"}</p></div><strong>{formatMoney(showTotal ? (selectedCardId ? visibleTotal : cardTotal) : (selectedCardId ? visibleInstallments : cardInstallments))}</strong><button className="inline-link" onClick={() => toast.info("Detalhes da fatura")}>ver detalhes <ChevronRight className="h-4 w-4" /></button></div></article><div className="card-detail-grid">{cards.map((card) => { const cardPurchases = visiblePurchases.filter((item) => item.cardId === card.id); const statement = cardStatements.find((item) => item.cardId === card.id); const amount = statement ? (showTotal ? statement.totalAmount : statement.installmentAmount) : cardPurchases.reduce((sum, item) => sum + Number(showTotal ? item.totalAmount : item.installmentAmount), 0); return <article className="card-detail" key={`${card.id}-detail`}><div className="card-detail-header"><span className="card-brand">{card.brand.slice(0, 3)}</span><div><h3>{card.name}</h3><p className="card-detail-meta">fecha dia {card.closingDay} · vence {statementDueDate(card.dueDay)}</p></div></div><p className="card-detail-total">{formatMoney(amount)}</p><p className="card-detail-meta">{cardPurchases.length} compras internas · {cardPurchases.length ? "em aberto" : "sem compras"}</p><div className="card-detail-footer"><span>vence {statementDueDate(card.dueDay)}</span><button className="edit-link" onClick={() => { if (cardPurchases[0]) onEditPurchase(cardPurchases[0]); else toast.info("Não há compras nesta fatura para editar"); }}>editar compra</button><strong>Ver detalhes <ChevronRight className="inline h-3 w-3" /></strong></div></article>; })}</div></div>;
}

function Couple({ month = currentMonthKey() }: { month?: string }) {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.finance.couple.useQuery({ month }, { enabled: isAuthenticated });
  const summary = data?.summary;
  const coupleProfiles = data?.profiles ?? [];
  const monthLabel = formatMonthLabel(month);
  const hasData = coupleProfiles.length > 0;
  const felipe = coupleProfiles.find((profile) => profile.profileKey === "felipe");
  const sara = coupleProfiles.find((profile) => profile.profileKey === "sara");
  const positiveBalanceTotal = Math.max(0, felipe?.summary.balance ?? 0) + Math.max(0, sara?.summary.balance ?? 0);
  const felipeShare = positiveBalanceTotal > 0 ? Math.round((Math.max(0, felipe?.summary.balance ?? 0) / positiveBalanceTotal) * 100) : 0;
  const saraShare = positiveBalanceTotal > 0 ? 100 - felipeShare : 0;
  const emptyCopy = isLoading ? "Carregando os dados dos dois perfis..." : "Cadastre lançamentos, contas, investimentos ou cartões para formar o resumo do casal.";
  return <div className="space-y-5"><div className="couple-hero"><div className="couple-figures"><UserRound className="h-10 w-10" /><UsersRound className="h-12 w-12 -ml-3" /></div><div><p className="eyebrow">visão consolidada · {monthLabel}</p><h2>Resumo geral do casal</h2><p className="mt-2 text-sm text-slate-400">Felipe + Sara em uma única leitura visual, calculada a partir dos dados persistidos de cada perfil.</p></div></div><div className="stats-grid four"><StatCard label="Saldo consolidado" value={formatMoney(summary?.balance ?? 0)} detail="entradas menos saídas do mês" tone="blue" /><StatCard label="Entradas" value={formatMoney(summary?.income ?? 0)} detail="receitas de Felipe + Sara" tone="mint" /><StatCard label="Saídas" value={formatMoney(summary?.expenses ?? 0)} detail="despesas dos dois perfis" tone="clay" /><StatCard label="Comprometido" value={`${Math.min(100, summary?.commitment ?? 0).toFixed(1)}%`} detail="das entradas do casal" tone="gold" /></div>{!hasData && <div className="couple-empty"><UsersRound className="h-5 w-5" /><span>{emptyCopy}</span></div>}<div className="couple-detail-grid"><article className="panel couple-detail-card"><p className="eyebrow">contas</p><h3>Visão financeira</h3><div className="couple-detail-value">{formatMoney(summary?.balance ?? 0)}</div><p>Saldo disponível · {summary?.totalBills ?? 0} contas cadastradas</p></article><article className="panel couple-detail-card"><p className="eyebrow">investimentos</p><h3>Patrimônio investido</h3><div className="couple-detail-value">{formatMoney(summary?.invested ?? 0)}</div><p>{formatMoney(summary?.investedAmount ?? 0)} aportado · resultado {formatMoney(summary?.investmentResult ?? 0)}</p><p className="detail-note">{coupleProfiles.reduce((sum, profile) => sum + profile.investmentCount, 0)} registros de investimento</p></article><article className="panel couple-detail-card"><p className="eyebrow">cartões</p><h3>Faturas do mês</h3><div className="couple-detail-value">{formatMoney(summary?.cardInstallments ?? 0)}</div><p>{summary?.totalCards ?? 0} cartões · {formatMoney(summary?.cardTotal ?? 0)} em compras totais</p></article></div><div className="content-grid couple-grid"><article className="panel person-panel"><div className="person-head"><div className="avatar avatar-blue">F</div><div><p className="eyebrow">fluxo felipe</p><h2>Visão individual</h2></div><span className="person-tag">{felipe?.billCount ?? 0} contas</span></div><p className="person-value">{formatMoney(felipe?.summary.balance ?? 0)}</p><div className="progress-line"><span style={{ width: `${felipeShare}%` }} /></div><p className="mt-3 text-xs text-slate-500">{hasData ? `${felipeShare}% do saldo positivo consolidado` : "Aguardando dados persistidos"}</p></article><article className="panel person-panel"><div className="person-head"><div className="avatar avatar-purple">S</div><div><p className="eyebrow">fluxo sara</p><h2>Visão individual</h2></div><span className="person-tag">{sara?.billCount ?? 0} contas</span></div><p className="person-value">{formatMoney(sara?.summary.balance ?? 0)}</p><div className="progress-line purple"><span style={{ width: `${saraShare}%` }} /></div><p className="mt-3 text-xs text-slate-500">{hasData ? `${saraShare}% do saldo positivo consolidado` : "Aguardando dados persistidos"}</p></article></div><article className="panel couple-breakdown"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">distribuição do patrimônio</p><h2>Instituições e faturas</h2><p className="mt-2 text-sm text-slate-400">Os totais abaixo somam somente registros de Felipe e Sara no mês selecionado.</p></div><span className="profile-chip">{data?.institutions.length ?? 0} INSTITUIÇÕES</span></div><div className="couple-breakdown-grid"><div><p className="eyebrow">saldo por instituição</p>{data?.institutions.length ? data.institutions.map((institution) => <div className="couple-breakdown-row" key={institution.institution}><span>{institution.institution}<small>{institution.profiles.map((profile) => profile === "felipe" ? "Felipe" : "Sara").join(" + ")}</small></span><strong>{formatMoney(institution.marketValue)}</strong></div>) : <p className="empty-inline">Nenhum investimento persistido nos perfis.</p>}</div><div><p className="eyebrow">faturas individuais</p>{data?.cards.length ? data.cards.map((card) => <div className="couple-breakdown-row" key={`${card.profileKey}-${card.id}`}><span><b>{card.name}</b><small>{card.profileName} · {card.purchaseCount} compras</small></span><strong>{formatMoney(card.installmentAmount)}</strong></div>) : <p className="empty-inline">Nenhum cartão persistido nos perfis.</p>}</div></div></article></div>;
}

function Trash({ profileId }: { profileId?: number }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.bootstrap.useQuery({ profileId }, { enabled: isAuthenticated && !!profileId });
  const restore = trpc.finance.restoreTrash.useMutation();
  const permanentlyDelete = trpc.finance.permanentlyDeleteTrash.useMutation();
  const utils = trpc.useUtils();
  const items = data?.trash ?? [];
  return <div className="space-y-5"><SectionHeader eyebrow="itens removidos" title="Lixeira" subtitle="Recupere um registro ou remova tudo de forma permanente." actions={<><ActionButton variant="ghost" onClick={() => toast.info(`${items.length} itens na lixeira`)}><Check className="h-4 w-4" /> selecionar tudo</ActionButton><ActionButton onClick={() => toast.info("A exclusão permanente em lote será adicionada depois da confirmação individual") }><Trash2 className="h-4 w-4" /> esvaziar lixeira</ActionButton></>} /><article className="panel trash-panel">{items.length === 0 ? <div className="empty-state"><img src={EMPTY_URL} alt="" /><h2>Lixeira vazia.</h2><p>Nada por aqui — tudo o que foi excluído já foi restaurado ou removido.</p></div> : items.map((item) => <div className="trash-row" key={item.id}><div className="icon-tile clay"><Trash2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-200">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.entityType} · removido em {new Date(item.deletedAt).toLocaleDateString("pt-BR")}</p></div><div className="flex items-center gap-2"><button className="restore-btn" disabled={restore.isPending} onClick={() => { restore.mutate({ id: item.id }, { onSuccess: () => { utils.finance.bootstrap.invalidate(); toast.success("Item restaurado"); }, onError: () => toast.error("Não foi possível restaurar o item") }); }}>restaurar</button><button className="icon-button-danger" aria-label="Excluir permanentemente" disabled={permanentlyDelete.isPending} onClick={() => { if (!window.confirm("Excluir este item permanentemente? Esta ação não pode ser desfeita.")) return; permanentlyDelete.mutate({ id: item.id }, { onSuccess: () => { utils.finance.bootstrap.invalidate(); toast.success("Item removido permanentemente"); }, onError: () => toast.error("Não foi possível remover o item") }); }}>×</button></div></div>)}</article></div>;
}

function AddModal({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState("Saída");
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-start justify-between"><div><p className="eyebrow">novo registro</p><h2>Adicionar movimentação</h2><p className="mt-2 text-sm text-slate-400">Inclua uma linha no período selecionado.</p></div><button className="modal-close" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="modal-form"><label>Descrição<input placeholder="ex.: mercado, salário, transferência" /></label><label>Data<input type="date" defaultValue={dateKeyFromDate(new Date())} /></label><label>Categoria<SelectField><option>Casa</option><option>Alimentação</option><option>Transferências</option><option>Investimentos</option></SelectField></label><label>Banco<SelectField><option>Inter</option><option>Rico</option><option>PicPay</option><option>Itaú</option></SelectField></label><div className="kind-toggle"><button className={kind === "Entrada" ? "active" : ""} onClick={() => setKind("Entrada")}><ArrowDownLeft className="h-4 w-4" /> Entrada</button><button className={kind === "Saída" ? "active" : ""} onClick={() => setKind("Saída")}><ArrowUpRight className="h-4 w-4" /> Saída</button></div><label>Valor<input placeholder="R$ 0,00" inputMode="decimal" /></label></div><div className="modal-footer"><button className="text-sm text-slate-400 transition hover:text-white" onClick={onClose}>cancelar</button><ActionButton onClick={() => { toast.success("Movimentação adicionada ao fluxo"); onClose(); }}><Check className="h-4 w-4" /> adicionar {kind.toLowerCase()}</ActionButton></div></div></div>;
}

function PersistentAddModal({ onClose, profileId }: { onClose: () => void; profileId?: number }) {
  const [kind, setKind] = useState<"in" | "out">("out");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => dateKeyFromDate(new Date()));
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

type FinanceFormKind = "transaction" | "bill" | "investment" | "card" | "purchase" | "goal";
type FinanceFormItem = Record<string, unknown>;

function inputDate(value: unknown, fallback: string) {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : dateKeyFromDate(date);
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && dateKeyFromDate(date) === value;
}

function FinanceFormModal({ kind, item, profileId, cards = [], onClose, onDelete }: { kind: FinanceFormKind; item?: FinanceFormItem; profileId?: number; cards?: Array<{ id: number; name: string }>; onClose: () => void; onDelete?: (item: FinanceFormItem) => void }) {
  const initial = useMemo(() => ({
    description: String(item?.description ?? ""), category: String(item?.category ?? "Casa"), bank: String(item?.bank ?? "Inter"), amount: String(item?.amount ?? ""), date: inputDate(item?.date, dateKeyFromDate(new Date())), direction: String(item?.direction ?? "out"), responsible: String(item?.responsible ?? "Felipe"), dueDate: inputDate(item?.dueDate, dateKeyFromDate(new Date())), status: String(item?.status ?? "pending"), institution: String(item?.institution ?? "Inter"), investedAmount: String(item?.investedAmount ?? ""), marketValue: String(item?.marketValue ?? ""), investedAt: inputDate(item?.investedAt, dateKeyFromDate(new Date())), name: String(item?.name ?? ""), targetAmount: String(item?.targetAmount ?? ""), currentAmount: String(item?.currentAmount ?? "0"), targetDate: inputDate(item?.targetDate, ""), brand: String(item?.brand ?? "Visa"), dueDay: String(item?.dueDay ?? "20"), closingDay: String(item?.closingDay ?? "13"), cardId: String(item?.cardId ?? cards[0]?.id ?? ""), purchaseDate: inputDate(item?.purchaseDate, dateKeyFromDate(new Date())), totalAmount: String(item?.totalAmount ?? ""), installments: String(item?.installments ?? "1"), currentInstallment: String(item?.currentInstallment ?? "1"), notes: String(item?.notes ?? "")
  }), [item, cards]);
  const [form, setForm] = useState(initial);
  const { isAuthenticated } = useAuth();
  const categoryQuery = trpc.finance.categories.useQuery({ profileId: profileId as number }, { enabled: isAuthenticated && !!profileId });
  const categoryNames: string[] = Array.from(new Set([...(categoryQuery.data ?? []).filter((category) => category.status === "active" && category.direction === form.direction).map((category) => String(category.name)), form.category].filter((value): value is string => Boolean(value))));
  const categoryListId = `finance-category-options-${profileId ?? "demo"}`;
  const update = (key: keyof typeof initial, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const createTransaction = trpc.finance.createTransaction.useMutation();
  const updateTransaction = trpc.finance.updateTransaction.useMutation();
  const createBill = trpc.finance.createBill.useMutation();
  const updateBill = trpc.finance.updateBill.useMutation();
  const createInvestment = trpc.finance.createInvestment.useMutation();
  const updateInvestment = trpc.finance.updateInvestment.useMutation();
  const createCreditCard = trpc.finance.createCreditCard.useMutation();
  const updateCreditCard = trpc.finance.updateCreditCard.useMutation();
  const createCardPurchase = trpc.finance.createCardPurchase.useMutation();
  const updateCardPurchase = trpc.finance.updateCardPurchase.useMutation();
  const createSavingsGoal = trpc.finance.createSavingsGoal.useMutation();
  const updateSavingsGoal = trpc.finance.updateSavingsGoal.useMutation();
  const utils = trpc.useUtils();
  const title = item ? "Editar registro" : kind === "transaction" ? "Adicionar movimentação" : kind === "bill" ? "Adicionar conta" : kind === "investment" ? "Adicionar investimento" : kind === "card" ? "Adicionar cartão" : kind === "purchase" ? "Adicionar compra à fatura" : "Adicionar caixinha";
  const isPending = createTransaction.isPending || updateTransaction.isPending || createBill.isPending || updateBill.isPending || createInvestment.isPending || updateInvestment.isPending || createCreditCard.isPending || updateCreditCard.isPending || createCardPurchase.isPending || updateCardPurchase.isPending || createSavingsGoal.isPending || updateSavingsGoal.isPending;
  const finish = (message: string) => { utils.finance.bootstrap.invalidate(); utils.finance.transactions.invalidate(); utils.finance.audit.invalidate(); utils.finance.savingsGoals.invalidate(); toast.success(message); onClose(); };
  const fail = (error: { message?: string }) => toast.error(error.message || "Não foi possível salvar o registro");
  const submit = () => {
    if (!profileId) { toast.error("Faça login para salvar dados financeiros"); return; }
    const amount = Number(form.amount.replace(",", "."));
    const investedAmount = Number(form.investedAmount.replace(",", "."));
    const marketValue = Number(form.marketValue.replace(",", "."));
    const totalAmount = Number(form.totalAmount.replace(",", "."));
    if (kind === "transaction") {
      if (!form.description.trim() || !isValidDateInput(form.date) || !Number.isFinite(amount) || amount <= 0) { toast.error("Informe descrição, data e valor válidos"); return; }
      const payload = { profileId, date: new Date(`${form.date}T12:00:00`), description: form.description.trim(), category: form.category.trim(), bank: form.bank.trim(), direction: form.direction as "in" | "out", amount, notes: form.notes.trim() || undefined };
      if (item?.id) updateTransaction.mutate({ id: Number(item.id), ...payload }, { onSuccess: () => finish("Lançamento atualizado"), onError: fail }); else createTransaction.mutate(payload, { onSuccess: () => finish("Movimentação salva"), onError: fail });
      return;
    }
    if (kind === "bill") {
      if (!form.description.trim() || !isValidDateInput(form.dueDate) || !Number.isFinite(amount) || amount <= 0 || !form.responsible.trim()) { toast.error("Informe descrição, vencimento, responsável e valor válidos"); return; }
      const payload = { description: form.description.trim(), dueDate: new Date(`${form.dueDate}T12:00:00`), amount, responsible: form.responsible.trim(), status: form.status as "pending" | "paid" | "late" };
      if (item?.id) updateBill.mutate({ id: Number(item.id), ...payload }, { onSuccess: () => finish("Conta atualizada"), onError: fail }); else createBill.mutate({ profileId, ...payload }, { onSuccess: () => finish("Conta salva"), onError: fail });
      return;
    }
    if (kind === "investment") {
      if (!form.description.trim() || !form.category.trim() || !form.institution.trim() || !isValidDateInput(form.investedAt) || !Number.isFinite(investedAmount) || investedAmount <= 0 || !Number.isFinite(marketValue) || marketValue < 0) { toast.error("Preencha descrição, categoria, instituição, data e valores válidos"); return; }
      const payload = { description: form.description.trim(), category: form.category.trim(), institution: form.institution.trim(), investedAmount, marketValue, investedAt: new Date(`${form.investedAt}T12:00:00`) };
      if (item?.id) updateInvestment.mutate({ id: Number(item.id), ...payload }, { onSuccess: () => finish("Investimento atualizado"), onError: fail }); else createInvestment.mutate({ profileId, ...payload }, { onSuccess: () => finish("Investimento salvo"), onError: fail });
      return;
    }
    if (kind === "goal") {
      const targetAmount = Number(form.targetAmount.replace(",", "."));
      const currentAmount = Number(form.currentAmount.replace(",", "."));
      if (!form.name.trim() || !form.category.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(currentAmount) || currentAmount < 0 || (form.targetDate && !isValidDateInput(form.targetDate))) { toast.error("Preencha objetivo, categoria e valores válidos"); return; }
      const payload = { name: form.name.trim(), category: form.category.trim(), targetAmount, currentAmount, targetDate: form.targetDate ? new Date(`${form.targetDate}T12:00:00`) : null, notes: form.notes.trim() || undefined };
      if (item?.id) updateSavingsGoal.mutate({ id: Number(item.id), ...payload }, { onSuccess: () => finish("Caixinha atualizada"), onError: fail }); else createSavingsGoal.mutate({ profileId, profileKey: "sara", ...payload }, { onSuccess: () => finish("Caixinha salva"), onError: fail });
      return;
    }
    if (kind === "card") {
      const dueDay = Number(form.dueDay); const closingDay = Number(form.closingDay);
      if (!form.name.trim() || !form.brand.trim() || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31 || !Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31) { toast.error("Preencha nome, bandeira e dias válidos"); return; }
      const payload = { name: form.name.trim(), brand: form.brand.trim(), dueDay, closingDay };
      if (item?.id) updateCreditCard.mutate({ id: Number(item.id), ...payload }, { onSuccess: () => finish("Cartão atualizado"), onError: fail }); else createCreditCard.mutate({ profileId, ...payload }, { onSuccess: () => finish("Cartão salvo"), onError: fail });
      return;
    }
    const installments = Number(form.installments); const currentInstallment = Number(form.currentInstallment); const cardId = Number(form.cardId);
    if (!cardId || !form.description.trim() || !form.category.trim() || !isValidDateInput(form.purchaseDate) || !Number.isFinite(totalAmount) || totalAmount <= 0 || !Number.isInteger(installments) || installments < 1 || !Number.isInteger(currentInstallment) || currentInstallment < 1 || currentInstallment > installments) { toast.error("Preencha cartão, descrição, data, valor e parcelas válidos"); return; }
    const payload = { description: form.description.trim(), category: form.category.trim(), purchaseDate: new Date(`${form.purchaseDate}T12:00:00`), totalAmount, installments, currentInstallment };
    if (item?.id) updateCardPurchase.mutate({ id: Number(item.id), ...payload }, { onSuccess: () => finish("Compra atualizada"), onError: fail }); else createCardPurchase.mutate({ profileId, cardId, ...payload }, { onSuccess: () => finish("Compra adicionada à fatura"), onError: fail });
  };
  const field = (label: string, key: keyof typeof initial, type = "text", placeholder = "") => <label>{label}<input type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} /></label>;
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="eyebrow">{item ? "edição persistente" : "novo registro persistente"}</p><h2>{title}</h2><p className="mt-2 text-sm text-slate-400">Os dados serão salvos no perfil selecionado.</p></div><button className="modal-close" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button></div><div className="modal-form">{kind === "transaction" && <>{field("Descrição", "description", "text", "ex.: mercado, salário")}{field("Data", "date", "date")}<label>Categoria<input list={categoryListId} value={form.category} onChange={(event) => update("category", event.target.value)} placeholder="ex.: Casa" /><datalist id={categoryListId}>{categoryNames.map((category) => <option key={category} value={category} />)}</datalist></label>{field("Banco", "bank", "text", "ex.: Inter")}<div className="kind-toggle"><button className={form.direction === "in" ? "active" : ""} onClick={() => update("direction", "in")}><ArrowDownLeft className="h-4 w-4" /> Entrada</button><button className={form.direction === "out" ? "active" : ""} onClick={() => update("direction", "out")}><ArrowUpRight className="h-4 w-4" /> Saída</button></div>{field("Valor", "amount", "text", "R$ 0,00")}{field("Observações", "notes", "text", "opcional")}</>}{kind === "bill" && <>{field("Descrição", "description", "text", "ex.: aluguel")}{field("Vencimento", "dueDate", "date")}{field("Valor", "amount", "text", "R$ 0,00")}{field("Responsável", "responsible", "text", "Felipe ou Sara")}<label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="pending">Pendente</option><option value="paid">Paga</option><option value="late">Atrasada</option></select></label></>}{kind === "investment" && <>{field("Descrição", "description", "text", "ex.: Tesouro Selic")}{field("Categoria", "category", "text", "ex.: Renda fixa")}{field("Instituição", "institution", "text", "ex.: Inter")}{field("Data", "investedAt", "date")}{field("Valor investido", "investedAmount", "text", "R$ 0,00")}{field("Valor de mercado", "marketValue", "text", "R$ 0,00")}</>}{kind === "goal" && <>{field("Nome do objetivo", "name", "text", "ex.: reserva de emergência")}{field("Categoria", "category", "text", "ex.: Reserva")}{field("Meta", "targetAmount", "text", "R$ 0,00")}{field("Valor guardado", "currentAmount", "text", "R$ 0,00")}{field("Prazo", "targetDate", "date")}{field("Observações", "notes", "text", "opcional")}</>}{kind === "card" && <>{field("Nome do cartão", "name", "text", "ex.: Nubank")}{field("Bandeira", "brand", "text", "Visa, Mastercard...")}{field("Dia de fechamento", "closingDay", "number", "1 a 31")}{field("Dia de vencimento", "dueDay", "number", "1 a 31")}</>}{kind === "purchase" && <>{<label>Cartão<select value={form.cardId} onChange={(event) => update("cardId", event.target.value)}><option value="">Selecione um cartão</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>}{field("Descrição", "description", "text", "ex.: supermercado")}{field("Categoria", "category", "text", "ex.: Alimentação")}{field("Data da compra", "purchaseDate", "date")}{field("Valor total", "totalAmount", "text", "R$ 0,00")}{field("Número de parcelas", "installments", "number", "1")}{field("Parcela atual", "currentInstallment", "number", "1")}</>}</div><div className="modal-footer">{kind === "transaction" && item?.id !== undefined && onDelete && <button className="danger-text-button" onClick={() => onDelete(item)} disabled={isPending}><Trash2 className="h-4 w-4" /> excluir lançamento</button>}<button className="text-sm text-slate-400 transition hover:text-white" onClick={onClose}>cancelar</button><ActionButton onClick={submit} disabled={isPending}>{isPending ? "salvando..." : <><Check className="h-4 w-4" /> salvar</>}</ActionButton></div></div></div>;
}

function Sidebar({ active, onChange, person, onPersonChange, profileId, month }: { active: View; onChange: (view: View) => void; person: Person; onPersonChange: (p: Person) => void; profileId?: number; month: string }) {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.finance.routine.useQuery(profileId ? { profileId, month } : undefined as never, { enabled: isAuthenticated && !!profileId });
  const overdueCount = data?.overdueBills?.length ?? 0;
  const upcomingCount = data?.upcomingBills?.length ?? 0;
  const alertTitle = overdueCount > 0 ? `${overdueCount} vencimento${overdueCount === 1 ? "" : "s"} atrasado${overdueCount === 1 ? "" : "s"}.` : upcomingCount > 0 ? `${upcomingCount} próximo${upcomingCount === 1 ? "" : "s"} vencimento${upcomingCount === 1 ? "" : "s"}.` : "Nenhum vencimento crítico.";
  const alertDetail = overdueCount > 0 ? "Revise suas contas pendentes." : upcomingCount > 0 ? "O painel acompanha você." : "Tudo sob controle por enquanto.";
  return <aside className="sidebar"><Logo /><div className="sidebar-divider" /><div className="sidebar-period"><p className="eyebrow">período ativo</p><p className="sidebar-month">{formatMonthLabel(month).toUpperCase()}</p><p className="sidebar-updated"><span /> atualização diária</p></div><nav className="desktop-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => onChange(id)}><Icon className="h-[18px] w-[18px]" />{label}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><Lightbulb className="h-4 w-4 text-[#d5c486]" /><div><strong>{alertTitle}</strong><span>{alertDetail}</span></div></div><div className="profile-switch"><button className={person === "Felipe" ? "active" : ""} onClick={() => onPersonChange("Felipe")}><span className="avatar avatar-blue small">F</span><span>Felipe</span></button><button className={person === "Sara" ? "active" : ""} onClick={() => onPersonChange("Sara")}><span className="avatar avatar-purple small">S</span><span>Sara</span></button></div></div></aside>;
}

function MobileNav({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  return <nav className="mobile-nav">{navItems.filter(({ id }) => id !== "trash").map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => onChange(id)}><Icon className="h-5 w-5" /><span>{id === "investments" ? "Investir" : id === "overview" ? "Início" : id === "cards" ? "Cartões" : label}</span></button>)}</nav>;
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [active, setActive] = useState<View>("overview");
  const [person, setPerson] = useState<Person>("Felipe");
  const profilesQuery = trpc.finance.profiles.useQuery(undefined, { enabled: isAuthenticated });
  const activeProfileId = person === "Casal" ? undefined : profilesQuery.data?.find((profile) => profile.profileKey === person.toLowerCase())?.id;
  const [activeMonth, setActiveMonth] = useState(() => currentMonthKey());
  const financeQuery = trpc.finance.bootstrap.useQuery({ profileId: activeProfileId, month: activeMonth }, { enabled: isAuthenticated && !!activeProfileId });
  const { theme, toggleTheme } = useTheme();
  const [formState, setFormState] = useState<{ kind: FinanceFormKind; item?: FinanceFormItem } | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const utils = trpc.useUtils();
  const deleteTransaction = trpc.finance.deleteTransaction.useMutation();
  const deleteTransactionFromUi = (item: FinanceFormItem) => {
    const id = Number(item.id);
    if (!Number.isInteger(id) || id <= 0) return;
    if (!window.confirm(`Excluir "${String(item.description ?? "este lançamento")}"? Ele será enviado para a lixeira.`)) return;
    deleteTransaction.mutate({ id }, { onSuccess: () => { utils.finance.bootstrap.invalidate(); utils.finance.transactions.invalidate(); utils.finance.audit.invalidate(); setFormState(null); toast.success("Lançamento enviado para a lixeira"); }, onError: (error) => toast.error(error.message || "Não foi possível excluir o lançamento") });
  };
  const openForm = (kind: FinanceFormKind, item?: FinanceFormItem) => {
    if (!isAuthenticated || !activeProfileId) { toast.info("Faça login para cadastrar e editar dados financeiros"); return; }
    setFormState({ kind, item });
  };
  const openCategories = () => {
    if (!isAuthenticated || !activeProfileId) { toast.info("Faça login para configurar categorias"); return; }
    setCategoriesOpen(true);
  };
  const content = useMemo(() => {
    if (active === "accounts") return <Accounts profileId={activeProfileId} month={activeMonth} onAdd={() => openForm("bill")} onEdit={(item) => openForm("bill", item)} />;
    if (active === "investments") return <Investments profileId={activeProfileId} month={activeMonth} person={person} onAdd={() => openForm("investment")} onEdit={(item) => openForm("investment", item)} onAddGoal={() => openForm("goal")} onEditGoal={(item) => openForm("goal", item)} />;
    if (active === "cards") return <Cards profileId={activeProfileId} month={activeMonth} onAddCard={() => openForm("card")} onAddPurchase={() => openForm("purchase")} onEditCard={(item) => openForm("card", item)} onEditPurchase={(item) => openForm("purchase", item)} />;
    if (active === "trash") return <Trash profileId={activeProfileId} />;
    if (active === "couple") return <Couple month={activeMonth} />;
    return <Overview onAdd={() => openForm("transaction")} onAddBill={() => openForm("bill")} onAddInvestment={() => openForm("investment")} onAddCard={() => openForm("card")} onEdit={(item) => openForm("transaction", item)} onDelete={deleteTransactionFromUi} onManageCategories={openCategories} profileId={activeProfileId} month={activeMonth} summary={financeQuery.data?.summary} />;
  }, [active, activeProfileId, activeMonth, person, financeQuery.data, openForm, deleteTransactionFromUi, openCategories]);
  return <div className={`app-shell profile-${person.toLowerCase()} ${theme === "light" ? "light-mode" : ""}`}><Sidebar active={active} onChange={setActive} person={person} profileId={activeProfileId} month={activeMonth} onPersonChange={(next) => { setPerson(next); toast.success(`Fluxo ${next} ativo`); }} /><main className="main-shell"><header className="mobile-header"><button className="header-icon"><Menu className="h-5 w-5" /></button><Logo /><div className="flex items-center gap-2"><button className="header-icon" onClick={() => toggleTheme?.()} aria-label="Alternar tema">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button><button className="header-icon"><Bell className="h-4 w-4" /></button></div></header><div className="desktop-topbar"><div><span className="topbar-status" /><span>{financeQuery.isFetching ? "sincronizando" : isAuthenticated ? "dados persistidos" : "modo demonstração"}</span></div><div className="flex items-center gap-3"><button onClick={() => toggleTheme?.()} className="topbar-link">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} modo {theme === "dark" ? "claro" : "escuro"}</button><button className="topbar-link" onClick={openCategories}><Settings2 className="h-4 w-4" /> preferências</button>{isAuthenticated ? <button onClick={() => logout()} className="topbar-link">{user?.name ?? "sair"}</button> : <button onClick={() => startLogin()} className="topbar-link">entrar</button>}</div></div><div className="page-content"><WorkspaceHeader active={active} person={person} month={activeMonth} onMonthChange={setActiveMonth} onPersonChange={(next) => { setPerson(next); toast.success(`Fluxo ${next} ativo`); }} onAdd={() => openForm("transaction")} theme={theme} onToggleTheme={() => toggleTheme?.()} />{content}</div></main><MobileNav active={active} onChange={setActive} /><button className="floating-add" onClick={() => openForm("transaction")} aria-label="Adicionar movimentação"><Plus className="h-7 w-7" /></button>{formState && <FinanceFormModal kind={formState.kind} item={formState.item} profileId={activeProfileId} cards={(financeQuery.data?.cards ?? []).map((card) => ({ id: card.id, name: card.name }))} onClose={() => setFormState(null)} onDelete={deleteTransactionFromUi} />}{categoriesOpen && activeProfileId && <CategoriesManager profileId={activeProfileId} onClose={() => setCategoriesOpen(false)} />}</div>;
}
