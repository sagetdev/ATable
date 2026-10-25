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

export function isOpenNow(r: Restaurant, now = new Date()) {
  if (!r.hours) return false;
  const h = now.getHours() + now.getMinutes() / 60;
  return h >= r.hours.open && h < r.hours.close;
}

export function filterRestaurants(list: Restaurant[], f: Filters) {
  return list
    .filter((r) =>
      (f.cuisine === "Tous" || r.categories.some((category) => category.toLowerCase() === f.cuisine.toLowerCase())) &&
      (f.budgets.length === 0 || f.budgets.includes(r.price)) &&
      // OSM often has no rating. Do not hide an unreviewed place just because its rating is unknown.
      (r.rating <= 0 || r.rating >= f.minRating) &&
      r.distanceKm <= f.maxDistance &&
      (!f.openNow || isOpenNow(r)) &&
      (!f.hasMenu || !!r.menu?.length)
    )
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
