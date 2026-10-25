import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { DEFAULT_FILTERS, Filters } from "@/lib/filters";
import { ApiError, getNearbyRestaurants, searchRestaurants } from "@/lib/api";
import type { Restaurant } from "@/data/restaurants";

export type FavStatus = "todo" | "done";

type AppState = {
  location: string;
  coordinates: { latitude: number; longitude: number };
  onboarded: boolean;
  completeOnboarding: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  patchFilters: (p: Partial<Filters>) => void;
  resetFilters: () => void;
  favorites: Record<string, FavStatus>;
  toggleFavorite: (id: string) => void;
  restaurants: Restaurant[];
  loadingRestaurants: boolean;
  restaurantError: string | null;
  attribution: string;
  refreshRestaurants: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const DEFAULT_COORDINATES = { latitude: 45.5019, longitude: -73.5674 };
const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [favorites, setFavorites] = useState<Record<string, FavStatus>>({});
  const [coordinates, setCoordinates] = useState(DEFAULT_COORDINATES);
  const [location, setLocation] = useState("Montréal, Québec");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [attribution, setAttribution] = useState("© OpenStreetMap contributors");
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    let active = true;
    const syncDeviceLocation = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) return;
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        const [place] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (active && place) {
          setLocation([place.city, place.region].filter(Boolean).join(", ") || "Ma position");
        }
      } catch {
        // L'application reste utilisable avec le point de départ par défaut de Montréal.
      }
    };
    void syncDeviceLocation();
    return () => { active = false; };
  }, []);

  const refreshRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    setRestaurantError(null);
    try {
      const params = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radiusKm: Math.min(10, Math.max(0.1, filters.maxDistance)),
        limit: 30,
      };
      const result = searchQuery.trim().length >= 2
        ? await searchRestaurants({ ...params, query: searchQuery.trim() })
        : await getNearbyRestaurants(params);
      setRestaurants(result.restaurants);
      setAttribution(result.attribution);
    } catch (error) {
      setRestaurantError(error instanceof ApiError ? error.message : "Impossible de charger les restaurants.");
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  }, [coordinates.latitude, coordinates.longitude, filters.maxDistance, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => { void refreshRestaurants(); }, searchQuery.trim().length >= 2 ? 450 : 0);
    return () => clearTimeout(timer);
  }, [refreshRestaurants, searchQuery]);

  const value = useMemo<AppState>(
    () => ({
      location,
      coordinates,
      onboarded,
      completeOnboarding,
      filters,
      setFilters,
      patchFilters,
      resetFilters,
      favorites,
      toggleFavorite,
      restaurants,
      loadingRestaurants,
      restaurantError,
      attribution,
      refreshRestaurants,
      searchQuery,
      setSearchQuery,
    }),
    [
      location, coordinates, onboarded, completeOnboarding, filters, patchFilters, resetFilters,
      favorites, toggleFavorite, restaurants, loadingRestaurants, restaurantError, attribution,
      refreshRestaurants, searchQuery,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp doit être utilisé dans <AppProvider>");
  return v;
}
