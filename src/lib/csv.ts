/**
 * Parser CSV kecil (tanpa dependency). Mendukung:
 * - delimiter koma, titik koma (default Excel versi Indonesia), atau tab (paste dari Excel),
 *   dideteksi dari baris pertama
 * - field dalam tanda kutip, termasuk koma/newline di dalamnya dan "" sebagai kutip literal
 * - BOM UTF-8, baris kosong diabaikan
 */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const candidates: [string, number][] = [
    [",", count(",")],
    [";", count(";")],
    ["\t", count("\t")],
  ];
  const delimiter = candidates.sort((a, b) => b[1] - a[1])[0][0];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushRow = () => {
    row.push(field);
    field = "";
    if (row.some((f) => f.trim() !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      pushRow();
    } else {
      field += c;
    }
  }
  pushRow();
  return rows;
}
