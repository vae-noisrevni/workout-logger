// src/utils/csv.ts
export type CsvDelimiter = ',' | ';';

export const csvCell = (v: string | number): string => {
    const s = String(v);
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Excel в русской локали сохраняет CSV с «;», остальные сервисы — с «,» */
export function detectDelimiter(text: string): CsvDelimiter {
    const firstLine = text.replace(/^﻿/, '').split(/\r?\n/, 1)[0] ?? '';
    const semicolons = firstLine.split(';').length;
    const commas = firstLine.split(',').length;
    return semicolons > commas ? ';' : ',';
}

/** Разбор CSV с кавычками (RFC 4180): экранированные "" и переводы строк внутри ячеек */
export function parseCsv(text: string, delimiter: CsvDelimiter): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    const src = text.replace(/^﻿/, '');

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                cell += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === delimiter) {
            row.push(cell);
            cell = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && src[i + 1] === '\n') i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
        } else {
            cell += ch;
        }
    }
    if (cell !== '' || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }
    // Полностью пустые строки (например, в конце файла) игнорируем
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
