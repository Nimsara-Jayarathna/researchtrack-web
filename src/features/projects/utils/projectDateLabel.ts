import { parseLocalDateOnly } from "@/lib/dateOnly";

const readableDate = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Date-only project API values must not drift a day across timezones. */
export function projectDateLabel(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = parseLocalDateOnly(value);
  return date ? readableDate.format(date) : value;
}
