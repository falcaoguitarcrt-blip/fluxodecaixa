// Fluxo Pessoal — dashboard editorial fintech escuro, com desktop assimétrico e navegação inferior mobile.
import { useMemo, useState } from "react";
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

function ChartCard() {
  const bars = [36, 58, 42, 76, 50, 64, 44, 72, 57, 82, 62, 91];
  return (
    <article className="panel chart-panel">
      <div className="flex items-start justify-between gap-4">
        <div><p className="eyebrow">movimento mensal</p><h2>Entradas e saídas</h2></div>
        <div className="legend"><span><i className="legend-dot bg-[#5da3df]" /> Entradas</span><span><i className="legend-dot bg-[#c9ab58]" /> Saídas</span></div>
      </div>
      <div className="chart-area">
        <div className="chart-y"><span>R$ 6k</span><span>R$ 4k</span><span>R$ 2k</span><span>R$ 0</span></div>
        <div className="chart-bars">{bars.map((height, i) => <div className="bar-group" key={i}><div className="bar bar-in" style={{ height: `${height}%` }} /><div className="bar bar-out" style={{ height: `${Math.max(18, height - 24)}%` }} /></div>)}</div>
      </div>
      <div className="chart-x"><span>01 ago</span><span>08 ago</span><span>15 ago</span><span>22 ago</span><span>31 ago</span></div>
    </article>
  );
}

function CommitmentCard() {
  return (
    <article className="panel commitment-panel">
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">comprometimento da receita</p><h2>O dinheiro está encontrando destino.</h2></div><span className="trend-pill"><TrendingUp className="h-3.5 w-3.5" /> +12,4%</span></div>
      <div className="commitment-track"><span style={{ width: "42%" }} /><span style={{ width: "28%" }} /><span style={{ width: "18%" }} /></div>
      <div className="grid grid-cols-3 gap-3 pt-4"><div><p className="text-xs text-slate-500">Contas</p><p className="mt-1 text-sm font-semibold">42%</p></div><div><p className="text-xs text-slate-500">Cartões</p><p className="mt-1 text-sm font-semibold">28%</p></div><div><p className="text-xs text-slate-500">Investimentos</p><p className="mt-1 text-sm font-semibold">18%</p></div></div>
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

function Overview({ onAdd }: { onAdd: () => void }) {
  return <div className="space-y-5"><div className="welcome-band" style={{ backgroundImage: `linear-gradient(90deg, rgba(15,31,49,.97), rgba(15,31,49,.86)), url(${NOISE_URL})` }}><div><p className="eyebrow text-[#9ec4e2]">fluxo pessoal · agosto de 2026</p><h1>Seu dinheiro, em perspectiva.</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">Uma leitura calma para as decisões que importam. Acompanhe seu mês sem perder o fio.</p></div><div className="welcome-actions"><PeriodControl /><ActionButton onClick={onAdd}><Plus className="h-4 w-4" /> novo lançamento</ActionButton></div></div><div className="stats-grid"><StatCard label="Saldo consolidado" value="R$ 597,88" detail="contas e pagamentos do mês" tone="blue" icon={CircleDollarSign} /><StatCard label="Entradas" value="R$ 8.240,00" detail="+18,2% contra julho" tone="mint" icon={ArrowDownLeft} /><StatCard label="Saídas" value="R$ 7.642,12" detail="72 lançamentos no período" tone="clay" icon={ArrowUpRight} /><StatCard label="Investido" value="R$ 5.274,75" detail="patrimônio acompanhado" tone="gold" icon={TrendingUp} /></div><div className="content-grid"><ChartCard /><CommitmentCard /><DaySummary /><aside className="assistant-card"><div className="assistant-orb"><img src={ORB_URL} alt="" /></div><div><p className="eyebrow">sarinha ia</p><h2>Um olhar para o seu mês</h2><p className="mt-2 text-sm leading-6 text-slate-400">Você está mantendo 18% da receita em investimentos. Quer observar esse ritmo juntos?</p></div><button onClick={() => toast.success("Sarinha IA: análise adicionada ao seu resumo") } className="assistant-action">Conversar com a Sarinha <ChevronRight className="h-4 w-4" /></button></aside></div><TransactionsCard onAdd={onAdd} /></div>;
}

function FilterBar({ type }: { type: "accounts" | "investments" | "cards" }) {
  return <div className="filter-bar"><div className="filter-title"><Filter className="h-4 w-4 text-[#8aa9c1]" /><span>filtrar visão</span></div><SelectField><option>Todos os meses</option><option>agosto de 2026</option><option>julho de 2026</option></SelectField>{type === "investments" && <SelectField><option>Todos os bancos</option><option>Inter</option><option>Rico</option><option>PicPay</option></SelectField>}{type === "cards" && <SelectField><option>Todos os cartões</option><option>Cartão Inter</option></SelectField>}{type !== "cards" && <SelectField><option>Todas as categorias</option><option>Renda fixa</option><option>Casa</option><option>Alimentação</option></SelectField>}{type === "accounts" && <ActionButton variant="ghost" onClick={() => toast.success("CSV preparado para exportação")}><Download className="h-4 w-4" /> exportar CSV</ActionButton>}{type === "investments" && <ActionButton variant="ghost" onClick={() => toast.success("CSV preparado para exportação")}><Download className="h-4 w-4" /> exportar CSV</ActionButton>}</div>;
}

function Accounts() {
  return <div className="space-y-5"><SectionHeader eyebrow="contas do mês · agosto de 2026" title="Contas a pagar" subtitle="Um lugar claro para acompanhar os compromissos que não podem escapar." actions={<ActionButton onClick={() => toast.success("Formulário de nova conta aberto") }><Plus className="h-4 w-4" /> adicionar conta</ActionButton>} /><div className="account-toolbar"><span className="profile-chip">1 CONTA</span><SelectField className="w-56"><option>Todas</option><option>Pendentes</option><option>Pagas</option></SelectField></div><div className="stats-grid three"><StatCard label="Vencimentos" value="1" detail="neste mês" tone="gold" icon={CalendarDays} /><StatCard label="Pendentes" value="1" detail="aguardando pagamento" tone="clay" icon={Bell} /><StatCard label="Pagas" value="0" detail="até o momento" tone="mint" icon={Check} /></div><article className="panel bills-panel"><div className="list-head"><span className="checkbox" /><span>selecionar contas</span><span className="ml-auto text-xs uppercase tracking-[.14em] text-slate-500">status</span></div><div className="bill-row"><span className="checkbox" /><div className="icon-tile gold"><CalendarDays className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-200">Licenciamento do Carro - Final 4</p><p className="mt-1 text-xs text-slate-500">Vencimento: 31/08/2026 · Responsável: Felipe</p></div><strong>R$ 174,08</strong><span className="status pending">Pendente</span><button className="square-btn" onClick={() => toast.info("Editando conta") }><Pencil className="h-4 w-4" /></button></div></article></div>;
}

function Investments() {
  return <div className="space-y-5"><SectionHeader eyebrow="patrimônio do fluxo felipe" title="Investimentos" actions={<><ActionButton variant="ghost" onClick={() => toast.info("Modo de edição ativado")}><Pencil className="h-4 w-4" /></ActionButton><ActionButton onClick={() => toast.success("Formulário de novo investimento aberto")}><Plus className="h-4 w-4" /> novo investimento</ActionButton></>} /><FilterBar type="investments" /><div className="stats-grid four"><StatCard label="Total investido" value="R$ 5.274,75" tone="blue" /><StatCard label="Valor de mercado" value="R$ 5.274,75" tone="mint" /><StatCard label="Resultado" value="+R$ 0,00" tone="gold" /><StatCard label="Última atualização" value="18 de ago" tone="clay" /></div><div className="institution-strip"><p className="eyebrow">saldo por instituição</p><div className="flex flex-wrap gap-8"><span>Inter <strong>R$ 3.016,62</strong></span><span>Rico <strong>R$ 1.871,00</strong></span><span>PicPay <strong>R$ 387,13</strong></span></div></div><article className="panel table-panel"><div className="data-table desktop-table"><div className="table-row table-header"><span className="checkbox" /><span>descrição</span><span>categoria</span><span>instituição ↑</span><span>data ↑</span><span className="text-right">valor ↓</span><span /></div>{investments.map((item, index) => <div className={`table-row ${index % 2 ? "selected-row" : ""}`} key={`${item.description}-${index}`}><span className="checkbox" /><strong>{item.description}</strong><span>{item.category}</span><span>{item.institution}</span><span>{item.date}</span><strong className="text-right">{item.value}</strong><button className="square-btn" onClick={() => toast.info(`Editando ${item.description}`)}><Pencil className="h-4 w-4" /></button></div>)}</div><div className="mobile-investments">{investments.map((item, index) => <div className="mobile-investment-row" key={`${item.description}-mobile-${index}`}><div><p className="font-semibold text-slate-200">{item.description}</p><p className="mt-1 text-xs text-slate-500">{item.category} · {item.institution} · {item.date}</p></div><strong>{item.value}</strong></div>)}</div></article></div>;
}

function Cards() {
  return <div className="space-y-5"><SectionHeader eyebrow="controle separado · agosto de 2026" title="Cartão de crédito" actions={<><ActionButton variant="ghost" onClick={() => toast.info("Modo de edição ativado")}><Pencil className="h-4 w-4" /></ActionButton><ActionButton onClick={() => toast.success("Formulário de fatura aberto")}><Plus className="h-4 w-4" /> cadastrar e salvar fatura</ActionButton></>} /><FilterBar type="cards" /><div className="segmented"><span>Mostrar compras por</span><button className="active">Parcela do mês</button><button>Valor total</button></div><div className="segmented"><span>Exibir</span><button className="active">Todas</button><button>Só parceladas do mês</button></div><ActionButton onClick={() => toast.success("CSV preparado para exportação")}><Download className="h-4 w-4" /> exportar CSV</ActionButton><article className="panel card-statement"><div className="statement-head"><span className="checkbox" /><span>Cartão <span className="sort-badge">↕</span></span><span>Mês <span className="sort-badge">↕</span></span></div><div className="statement-row"><span className="checkbox" /><span>Cartão Inter</span><span>setembro de 2026</span></div><div className="statement-row selected-row"><span className="checkbox" /><span>Cartão Inter</span><span>agosto de 2026</span></div><div className="statement-total"><div><p className="eyebrow">fechamento dia 13 · vencimento dia 20</p><h2>Fatura de agosto</h2><p className="mt-2 text-sm text-slate-400">0 compras internas · em aberto</p></div><strong>R$ 0,00</strong><button className="inline-link" onClick={() => toast.info("Detalhes da fatura")}>ver detalhes <ChevronRight className="h-4 w-4" /></button></div></article></div>;
}

function Couple() {
  return <div className="space-y-5"><SectionHeader eyebrow="visão consolidada · agosto de 2026" title="Resumo geral do casal" subtitle="Felipe + Sara em uma única leitura visual." actions={<ActionButton onClick={() => toast.info("Alternando perfil do casal") }><UsersRound className="h-4 w-4" /> visão compartilhada</ActionButton>} /><div className="couple-hero"><div className="couple-figures"><UserRound className="h-10 w-10" /><UsersRound className="h-12 w-12 -ml-3" /></div><div><p className="eyebrow">duas rotinas, um só fluxo</p><h2>Decisões financeiras também podem ser leves.</h2><p className="mt-2 text-sm text-slate-400">Veja o saldo da casa, os compromissos de cada pessoa e o que está sendo construído em conjunto.</p></div></div><div className="stats-grid three"><StatCard label="Saldo consolidado" value="R$ 597,88" detail="contas e pagamentos do mês" tone="blue" /><StatCard label="Entradas" value="R$ 10.240,00" detail="Felipe + Sara" tone="mint" /><StatCard label="Saídas" value="R$ 9.642,12" detail="contas e cartões" tone="clay" /></div><div className="content-grid couple-grid"><article className="panel person-panel"><div className="person-head"><div className="avatar avatar-blue">F</div><div><p className="eyebrow">fluxo felipe</p><h2>Visão individual</h2></div><ChevronRight className="ml-auto h-5 w-5 text-slate-500" /></div><p className="person-value">R$ 597,88</p><div className="progress-line"><span style={{ width: "64%" }} /></div><p className="mt-3 text-xs text-slate-500">64% do saldo consolidado</p></article><article className="panel person-panel"><div className="person-head"><div className="avatar avatar-purple">S</div><div><p className="eyebrow">fluxo sara</p><h2>Visão individual</h2></div><ChevronRight className="ml-auto h-5 w-5 text-slate-500" /></div><p className="person-value">R$ 0,00</p><div className="progress-line purple"><span style={{ width: "36%" }} /></div><p className="mt-3 text-xs text-slate-500">36% do saldo consolidado</p></article></div></div>;
}

function Trash() {
  const [items, setItems] = useState([
    { id: 1, name: "Compra Home office", meta: "Lançamento · removido hoje" },
    { id: 2, name: "CDB 2 anos", meta: "Investimento · removido ontem" },
  ]);
  return <div className="space-y-5"><SectionHeader eyebrow="itens removidos · agosto de 2026" title="Lixeira" subtitle="Recupere um registro ou remova tudo de forma permanente." actions={<><ActionButton variant="ghost" onClick={() => toast.info(`${items.length} itens selecionados`)}><Check className="h-4 w-4" /> selecionar tudo</ActionButton><ActionButton onClick={() => { setItems([]); toast.success("Lixeira esvaziada permanentemente"); }}><Trash2 className="h-4 w-4" /> esvaziar lixeira</ActionButton></>} /><article className="panel trash-panel">{items.length === 0 ? <div className="empty-state"><img src={EMPTY_URL} alt="" /><h2>Lixeira vazia.</h2><p>Nada por aqui — tudo o que foi excluído já foi restaurado ou removido.</p></div> : items.map((item) => <div className="trash-row" key={item.id}><div className="icon-tile clay"><Trash2 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-200">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.meta}</p></div><button className="restore-btn" onClick={() => { setItems((current) => current.filter((entry) => entry.id !== item.id)); toast.success("Item restaurado"); }}>restaurar</button></div>)}</article></div>;
}

function AddModal({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState("Saída");
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-start justify-between"><div><p className="eyebrow">novo registro</p><h2>Adicionar movimentação</h2><p className="mt-2 text-sm text-slate-400">Inclua uma linha no seu fluxo de agosto.</p></div><button className="modal-close" onClick={onClose}><X className="h-5 w-5" /></button></div><div className="modal-form"><label>Descrição<input placeholder="ex.: mercado, salário, transferência" /></label><label>Data<input type="date" defaultValue="2026-08-21" /></label><label>Categoria<SelectField><option>Casa</option><option>Alimentação</option><option>Transferências</option><option>Investimentos</option></SelectField></label><label>Banco<SelectField><option>Inter</option><option>Rico</option><option>PicPay</option><option>Itaú</option></SelectField></label><div className="kind-toggle"><button className={kind === "Entrada" ? "active" : ""} onClick={() => setKind("Entrada")}><ArrowDownLeft className="h-4 w-4" /> Entrada</button><button className={kind === "Saída" ? "active" : ""} onClick={() => setKind("Saída")}><ArrowUpRight className="h-4 w-4" /> Saída</button></div><label>Valor<input placeholder="R$ 0,00" inputMode="decimal" /></label></div><div className="modal-footer"><button className="text-sm text-slate-400 transition hover:text-white" onClick={onClose}>cancelar</button><ActionButton onClick={() => { toast.success("Movimentação adicionada ao fluxo"); onClose(); }}><Check className="h-4 w-4" /> adicionar {kind.toLowerCase()}</ActionButton></div></div></div>;
}

function Sidebar({ active, onChange, person, onPersonChange }: { active: View; onChange: (view: View) => void; person: Person; onPersonChange: (p: Person) => void }) {
  return <aside className="sidebar"><Logo /><div className="sidebar-divider" /><div className="sidebar-period"><p className="eyebrow">período ativo</p><p className="sidebar-month">AGOSTO DE<br />2026</p><p className="sidebar-updated"><span /> atualização diária</p></div><nav className="desktop-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => onChange(id)}><Icon className="h-[18px] w-[18px]" />{label}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><Lightbulb className="h-4 w-4 text-[#d5c486]" /><div><strong>Nenhum vencimento crítico.</strong><span>O painel acompanha você.</span></div></div><div className="profile-switch"><button className={person === "Felipe" ? "active" : ""} onClick={() => onPersonChange("Felipe")}><span className="avatar avatar-blue small">F</span><span>Felipe</span></button><button className={person === "Sara" ? "active" : ""} onClick={() => onPersonChange("Sara")}><span className="avatar avatar-purple small">S</span><span>Sara</span></button></div></div></aside>;
}

function MobileNav({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  return <nav className="mobile-nav">{navItems.filter(({ id }) => id !== "trash").map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => onChange(id)}><Icon className="h-5 w-5" /><span>{id === "investments" ? "Investir" : id === "overview" ? "Início" : id === "cards" ? "Cartões" : label}</span></button>)}</nav>;
}

export default function Home() {
  const [active, setActive] = useState<View>("overview");
  const [person, setPerson] = useState<Person>("Felipe");
  const [showAdd, setShowAdd] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const content = useMemo(() => {
    if (active === "accounts") return <Accounts />;
    if (active === "investments") return <Investments />;
    if (active === "cards") return <Cards />;
    if (active === "trash") return <Trash />;
    if (active === "couple") return <Couple />;
    return <Overview onAdd={() => setShowAdd(true)} />;
  }, [active]);
  return <div className={`app-shell ${isLight ? "light-mode" : ""}`}><Sidebar active={active} onChange={setActive} person={person} onPersonChange={(next) => { setPerson(next); toast.success(`Fluxo ${next} ativo`); }} /><main className="main-shell"><header className="mobile-header"><button className="header-icon"><Menu className="h-5 w-5" /></button><Logo /><div className="flex items-center gap-2"><button className="header-icon" onClick={() => setIsLight((value) => !value)}><Sun className="h-4 w-4" /></button><button className="header-icon"><Bell className="h-4 w-4" /></button></div></header><div className="desktop-topbar"><div><span className="topbar-status" /><span>atualizado agora</span></div><div className="flex items-center gap-3"><button onClick={() => setIsLight((value) => !value)} className="topbar-link"><Sun className="h-4 w-4" /> modo {isLight ? "escuro" : "claro"}</button><button className="topbar-link"><Settings2 className="h-4 w-4" /> preferências</button></div></div><div className="page-content">{content}</div></main><MobileNav active={active} onChange={setActive} /><button className="floating-add" onClick={() => setShowAdd(true)} aria-label="Adicionar movimentação"><Plus className="h-7 w-7" /></button>{showAdd && <AddModal onClose={() => setShowAdd(false)} />}</div>;
}
