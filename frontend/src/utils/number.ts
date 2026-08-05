/**
 * Parses raw text input into a non-negative integer, stripping non-digit
 * characters and leading zeros (e.g. "01" -> 1, "0012" -> 12, "" -> 0).
 *
 * Used instead of `<input type="number">` because browsers can fail to
 * repaint the field when the new value is numerically equal to the old one
 * (typing "1" after "0" can visually stick at "01" even though React
 * re-renders with value=1).
 */
export function parseIntInput(raw: string): number {
  const digitsOnly = raw.replace(/\D/g, '')
  const normalized = digitsOnly.replace(/^0+(?=\d)/, '')
  return normalized === '' ? 0 : Number(normalized)
}

/** Formats a byte count as a short human-readable size (e.g. 1536 -> "1.5 KB"). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
