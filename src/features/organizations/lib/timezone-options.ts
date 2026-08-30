import { tzOffset } from "@date-fns/tz"
import { getAllTimezones, getCountry, getTimezone, type Timezone } from "countries-and-timezones"

export type TimezoneOption = {
  /** IANA id, e.g. "Asia/Kolkata" — this is what gets stored in the database. */
  value: string
  offsetMinutes: number
  /** e.g. "UTC+05:30" */
  offsetLabel: string
  /** e.g. "India Standard Time" */
  longName: string
  /** e.g. "India" — empty string for zones with no associated country (e.g. Etc/UTC). */
  country: string
  /** e.g. "(UTC+05:30) India Standard Time" — the IANA id is shown separately (see TimezoneCombobox). */
  label: string
}

// Keyed by calendar day (not a single flat cache) so a caller that passes a
// specific historical/future date — as tests do — always gets options
// computed for that date rather than silently reusing whatever date another
// caller happened to build the cache with first.
const cacheByDay = new Map<string, TimezoneOption[]>()

// countries-and-timezones' getAllTimezones() already excludes deprecated/
// alias entries and uses modern city names as canonical (e.g. "Asia/Kolkata",
// not the legacy "Asia/Calcutta" that Intl.supportedValuesOf("timeZone")
// actually returns as canonical on this runtime's tzdata) — so it's the
// source of both the id list and each zone's real country, rather than
// Intl.supportedValuesOf plus a hand-rolled alias table.
export function getTimezoneOptions(referenceDate: Date = new Date()): TimezoneOption[] {
  const cacheKey = referenceDate.toISOString().slice(0, 10)
  const cached = cacheByDay.get(cacheKey)
  if (cached) return cached

  const options = Object.values(getAllTimezones())
    .map((zone) => buildTimezoneOption(zone, referenceDate))
    // tzdata includes a handful of non-geographic placeholder ids (e.g.
    // "Factory") that Intl/tzOffset can't resolve a real offset for — not a
    // real location anyone would pick as their organization's timezone.
    .filter((option) => !Number.isNaN(option.offsetMinutes))
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.value.localeCompare(b.value))
  cacheByDay.set(cacheKey, options)
  return options
}

export function findTimezoneOption(
  options: TimezoneOption[],
  value: string
): TimezoneOption | undefined {
  return options.find((option) => option.value === value)
}

// Best-effort browser detection for preselecting a sensible default — falls
// back to undefined (caller keeps whatever it already had) if unsupported or
// the resolved zone somehow isn't one of the known options. The browser's
// own Intl can resolve to a legacy alias (e.g. "Asia/Calcutta") even though
// our options list only has the modern name ("Asia/Kolkata"), so normalize
// through the same alias table the options list is built from.
export function detectBrowserTimezone(): string | undefined {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    const modern = getTimezone(detected)?.aliasOf ?? detected
    return findTimezoneOption(getTimezoneOptions(), modern) ? modern : undefined
  } catch {
    return undefined
  }
}

// Word-prefix search across friendly name, country, and IANA id. Each query
// word must prefix some word of the target text (order-independent), so a
// multi-word query like "eastern euro" matches "Eastern European Standard
// Time". Plain single-string substring matching isn't enough here: a raw id
// can contain a word that happens to share a prefix with an unrelated
// country name (e.g. "Indiana", the US state, starts with "india" — the
// country) — see the looksLikeCountryQuery guard below.
export function searchTimezoneOptions(options: TimezoneOption[], query: string): TimezoneOption[] {
  const rawQuery = query.trim().toLowerCase()
  const queryWords = wordsOf(query)
  if (queryWords.length === 0) return options

  // If the query's words all resolve to some real country's name, restrict
  // matching to the country/friendly-name fields only, so a search for
  // "india" doesn't also pull in America/Indiana/* — free-text id/city
  // search (e.g. "kolk") still works normally for queries that aren't a
  // country name.
  const looksLikeCountryQuery = options.some((option) => matchesAllWords(option.country, queryWords))

  return options.filter((option) => {
    const nameOrCountryMatch =
      matchesAllWords(option.longName, queryWords) || matchesAllWords(option.country, queryWords)
    if (looksLikeCountryQuery) return nameOrCountryMatch

    const idMatch =
      option.value.toLowerCase().startsWith(rawQuery) ||
      matchesAllWords(leafSegment(option.value), queryWords)
    return nameOrCountryMatch || idMatch
  })
}

function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0)
}

function matchesAllWords(text: string, queryWords: string[]): boolean {
  const targetWords = wordsOf(text)
  return queryWords.every((queryWord) => targetWords.some((word) => word.startsWith(queryWord)))
}

function leafSegment(id: string): string {
  const parts = id.split("/")
  return parts[parts.length - 1]
}

function buildTimezoneOption(zone: Timezone, referenceDate: Date): TimezoneOption {
  const id = zone.name
  const offsetMinutes = tzOffset(id, referenceDate)
  const offsetLabel = formatOffsetLabel(offsetMinutes)
  const longName = getLongTimeZoneName(id, referenceDate)
  const country = zone.countries
    .map((code) => getCountry(code)?.name)
    .filter((name): name is string => !!name)
    .join(", ")
  return {
    value: id,
    offsetMinutes,
    offsetLabel,
    longName,
    country,
    label: `(${offsetLabel}) ${longName}`,
  }
}

function formatOffsetLabel(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+"
  const absMinutes = Math.abs(offsetMinutes)
  const hours = Math.floor(absMinutes / 60)
  const minutes = absMinutes % 60
  return `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function getLongTimeZoneName(id: string, referenceDate: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: id,
      timeZoneName: "long",
    }).formatToParts(referenceDate)
    return parts.find((part) => part.type === "timeZoneName")?.value ?? id
  } catch {
    return id
  }
}
