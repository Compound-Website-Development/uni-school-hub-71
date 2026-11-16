/**
 * CSV cell escaping that also neutralises spreadsheet formula injection.
 * Values beginning with =, +, -, @, TAB or CR are prefixed with an apostrophe
 * so spreadsheet apps treat them as text instead of executing them.
 */
const FORMULA_PREFIXES = new Set(["=", "+", "-", "@", "\t", "\r"]);

export const csvCell = (value: unknown): string => {
  let str = value === null || value === undefined ? "" : String(value);
  if (str.length > 0 && FORMULA_PREFIXES.has(str[0])) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};
