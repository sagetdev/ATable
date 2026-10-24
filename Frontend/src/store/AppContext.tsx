import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_FILTERS, Filters } from "@/lib/filters";

export type FavStatus = "todo" | "done";

type AppState = {
  location: string;
  onboarded: boolean;
  completeOnboarding: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  patchFilters: (p: Partial<Filters>) => void;
  resetFilters: () => void;
  favorites: Record<string, FavStatus>;
  toggleFavorite: (id: string) => void;
};

const INITIAL_FAVORITES: Record<string, FavStatus> = {
  "forno-verde": "todo",
  "miso-co": "todo",
  "green-corner": "todo",
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [favorites, setFavorites] = useState<Record<string, FavStatus>>(INITIAL_FAVORITES);

  const patchFilters = useCallback((p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p })), []);
  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const completeOnboarding = useCallback(() => setOnboarded(true), []);
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = "todo";
      return next;
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      location: "Montréal, Québec",
      onboarded,
      completeOnboarding,
      filters,
      setFilters,
      patchFilters,
      resetFilters,
      favorites,
      toggleFavorite,
    }),
    [onboarded, completeOnboarding, filters, patchFilters, resetFilters, favorites, toggleFavorite]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp doit être utilisé dans <AppProvider>");
  return v;
}
