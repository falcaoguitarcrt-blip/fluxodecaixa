export type InvestmentMarketRow = {
  investedAmount: string | number;
  marketValue: string | number;
};

export function hasUnpricedInvestments(rows: InvestmentMarketRow[]) {
  return rows.some((row) => Number(row.investedAmount) > 0 && Number(row.marketValue) === 0);
}
