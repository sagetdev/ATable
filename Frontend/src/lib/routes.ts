import type { Href } from "expo-router";

export const toRestaurant = (id: string) => `/restaurant/${id}` as Href;
export const toMenu = (id: string) => `/restaurant/${id}/menu` as Href;

export type TabKey = "decouvrir" | "carte" | "favoris" | "profil";

export const TAB_HREF: Record<TabKey, Href> = {
  decouvrir: "/decouvrir" as Href,
  carte: "/carte" as Href,
  favoris: "/favoris" as Href,
  profil: "/profil" as Href,
};
