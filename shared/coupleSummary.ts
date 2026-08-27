export type CoupleSummary = {
  income: number;
  expenses: number;
  balance: number;
  invested: number;
  investedAmount: number;
  monthlyContribution: number;
  investmentResult?: number;
  billsPending: number;
  cardInstallments: number;
  cardTotal: number;
  commitment: number;
  totalCards?: number;
  totalBills?: number;
  series?: Array<{ date: string; income: number; expenses: number }>;
};

export type PersonSummary = CoupleSummary | undefined;

/**
 * A Visão Geral deve usar exatamente o resumo retornado pela consulta couple
 * quando o seletor estiver em Casal. Para Felipe/Sara, mantém o resumo individual.
 */
export function selectSummaryForPerson(person: "Felipe" | "Sara" | "Casal", individualSummary: PersonSummary, coupleSummary: PersonSummary) {
  return person === "Casal" ? coupleSummary : individualSummary;
}
