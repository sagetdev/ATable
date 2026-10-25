import type { Restaurant } from "@/data/restaurants";

export type Filters = {
  cuisine: string;
  budgets: number[];
  minRating: number;
  maxDistance: number;
  openNow: boolean;
  hasMenu: boolean;
};

export const DEFAULT_FILTERS: Filters = {
  cuisine: "Tous",
  budgets: [],
  minRating: 4,
  maxDistance: 5,
  openNow: false,
  hasMenu: false,
};

const DAY_CODES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseClock(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes !== 0)) return null;
  return hours * 60 + minutes;
}

function clauseAppliesToday(dayPart: string | undefined, dayCode: string) {
  if (!dayPart) return true;
  return dayPart.split(",").some((range) => {
    const parts = range.split("-");
    const start = DAY_CODES.indexOf(parts[0]);
    const end = DAY_CODES.indexOf(parts[1] ?? parts[0]);
    const current = DAY_CODES.indexOf(dayCode);
    if (start < 0 || end < 0) return false;
    return start <= end ? current >= start && current <= end : current >= start || current <= end;
  });
}

function isWithinOpeningHours(schedule: string, now: Date) {
  if (/^24\/7$/.test(schedule.trim())) return true;
  const today = DAY_CODES[now.getDay()];
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const clauses = schedule.split(";").map((part) => part.trim()).filter(Boolean);
  let hasMatchingRule = false;
  let open = false;

  for (const clause of clauses) {
    const parts = clause.split(/\s+/);
    const possibleDayPart = parts.length > 1 ? parts[0] : undefined;
    const dayPart = possibleDayPart && /^(Mo|Tu|We|Th|Fr|Sa|Su)(?:[-,](?:Mo|Tu|We|Th|Fr|Sa|Su))*$/i.test(possibleDayPart)
      ? possibleDayPart
      : undefined;
    const hours = (dayPart ? parts.slice(1).join(" ") : clause).toLowerCase();
    if (!clauseAppliesToday(dayPart, today)) continue;
    if (hours === "off" || hours === "closed") {
      hasMatchingRule = true;
      open = false;
      continue;
    }
    if (hours === "24/7") {
      hasMatchingRule = true;
      open = true;
      continue;
    }
    const range = /^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/.exec(hours);
    if (!range) continue;
    const start = parseClock(range[1]);
    const end = parseClock(range[2]);
    if (start === null || end === null) continue;
    hasMatchingRule = true;
    open = end >= start
      ? minuteOfDay >= start && minuteOfDay < end
      : minuteOfDay >= start || minuteOfDay < end;
  }
  return hasMatchingRule && open;
}

export function isOpenNow(r: Restaurant, now = new Date()) {
  if (r.hours) {
    const h = now.getHours() + now.getMinutes() / 60;
    return h >= r.hours.open && h < r.hours.close;
  }
  if (r.openingHours) return isWithinOpeningHours(r.openingHours, now);
  return false;
}

export function filterRestaurants(list: Restaurant[], f: Filters) {
  return list
    .filter((r) =>
      (f.cuisine === "Tous" || r.categories.some((category) => category.toLowerCase() === f.cuisine.toLowerCase())) &&
      (f.budgets.length === 0 || (r.priceKnown !== false && f.budgets.includes(r.price))) &&
      (r.rating <= 0 || r.rating >= f.minRating) &&
      r.distanceKm <= f.maxDistance &&
      (!f.openNow || isOpenNow(r)) &&
      (!f.hasMenu || !!r.menu?.length)
    )
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
