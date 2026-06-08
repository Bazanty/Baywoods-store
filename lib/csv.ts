/**
 * Minimal RFC-4180 CSV serializer — quoted fields, doubled embedded quotes,
 * CRLF line endings so Excel parses correctly.
 */

function escapeField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  // Neutralise CSV formula injection (CWE-1236): a field starting with
  // = + @ tab or CR — or a "-" that isn't a plain negative number — can run
  // as a formula when the file is opened in Excel/Sheets. Exports carry
  // customer-supplied values (names, addresses, emails), so prefix those with
  // a single quote to force the spreadsheet to treat them as text.
  if (/^[=+@\t\r]/.test(str) || (str[0] === "-" && !/^-\d/.test(str))) {
    str = `'${str}`;
  }
  // Always wrap in quotes for predictability — handles commas, newlines, quotes.
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const header = columns.map((c) => escapeField(c.label)).join(",");
  const body = rows.map((row) =>
    columns.map((c) => escapeField(row[c.key])).join(",")
  );
  return [header, ...body].join("\r\n");
}

export function csvResponseHeaders(filename: string): HeadersInit {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${safe}"`,
    "Cache-Control": "no-store",
  };
}
