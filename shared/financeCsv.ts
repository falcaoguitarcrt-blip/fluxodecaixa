export type CsvTransaction = {
  date: string;
  description: string;
  category: string;
  bank: string;
  direction: "in" | "out";
  amount: number;
};

export type CsvRejection = { line: number; reason: string; raw: string };

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "");
}

function parseAmount(value: string) {
  const cleaned = value.replace(/R\$|\s/g, "");
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

export function parseFinanceCsv(content: string) {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [] as CsvTransaction[], rejected: [] as CsvRejection[] };
  const headers = splitCsvLine(lines[0]).map(normalize);
  const indexOf = (names: string[]) => headers.findIndex((header) => names.includes(header));
  const indexes = {
    date: indexOf(["data", "date"]),
    description: indexOf(["descricao", "description"]),
    category: indexOf(["categoria", "category"]),
    bank: indexOf(["banco", "bank", "instituicao"]),
    direction: indexOf(["tipo", "direction"]),
    amount: indexOf(["valor", "amount"]),
  };
  const missing = Object.entries(indexes).filter(([, index]) => index < 0).map(([key]) => key);
  if (missing.length) return { rows: [] as CsvTransaction[], rejected: [{ line: 1, reason: `Colunas ausentes: ${missing.join(", ")}`, raw: lines[0] }] };

  const rows: CsvTransaction[] = [];
  const rejected: CsvRejection[] = [];
  lines.slice(1).forEach((line, lineOffset) => {
    const cells = splitCsvLine(line);
    const date = parseDate(cells[indexes.date] ?? "");
    const description = cells[indexes.description]?.trim();
    const category = cells[indexes.category]?.trim();
    const bank = cells[indexes.bank]?.trim();
    const type = normalize(cells[indexes.direction] ?? "");
    const amount = parseAmount(cells[indexes.amount] ?? "");
    const direction = ["in", "entrada", "credito", "crédito"].includes(type) ? "in" : ["out", "saida", "saída", "debito", "débito"].includes(type) ? "out" : null;
    let reason: string | null = null;
    if (!date) reason = "Data inválida; use AAAA-MM-DD";
    else if (!description) reason = "Descrição obrigatória";
    else if (!category) reason = "Categoria obrigatória";
    else if (!bank) reason = "Banco obrigatório";
    else if (!direction) reason = "Tipo inválido; use entrada ou saída";
    else if (amount === null) reason = "Valor inválido";
    if (reason) rejected.push({ line: lineOffset + 2, reason, raw: line });
    else rows.push({ date: date as string, description: description as string, category: category as string, bank: bank as string, direction: direction as "in" | "out", amount: amount as number });
  });
  return { rows, rejected };
}

function escapeCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeFinanceCsv(rows: CsvTransaction[]) {
  return ["data,descrição,categoria,banco,tipo,valor", ...rows.map((row) => [row.date, row.description, row.category, row.bank, row.direction === "in" ? "entrada" : "saída", row.amount.toFixed(2)].map(escapeCell).join(","))].join("\n");
}
