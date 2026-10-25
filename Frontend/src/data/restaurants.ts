import type { Tone } from "@/lib/tones";

// Jeu de données de démonstration conservé pour Storybook / aperçu UI. L’application utilise l’API pour la découverte.

export type MenuItemData = {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  tone: Tone;
  category: string;
};

export type Restaurant = {
  id: string;
  name: string;
  emoji: string;
  tone: Tone;
  cuisine: string;
  descriptor?: string;
  categories: string[];
  price: 1 | 2 | 3 | 4;
  rating: number;
  reviews?: number;
  distanceKm: number;
  about?: string;
  address?: string;
  hours?: { open: number; close: number };
  website?: string;
  menuSummary?: string;
  menuCategories?: string[];
  menu?: MenuItemData[];
  priceKnown?: boolean;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingHours?: string;
  wikidataId?: string;
  imageUrl?: string;
  attribution?: string;
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: "forno-verde",
    name: "Forno Verde",
    emoji: "🍕",
    tone: "rose",
    cuisine: "Italien",
    descriptor: "Italien contemporain · Pizzeria",
    categories: ["Italien"],
    price: 2,
    rating: 4.8,
    reviews: 328,
    distanceKm: 1.2,
    about: "Pizzas au feu de bois, produits de saison et ambiance conviviale.",
    address: "125 rue Saint-Paul, Montréal",
    hours: { open: 11, close: 22 },
    website: "https://www.fornoverde.example",
    menuSummary: "Pizzas, entrées et desserts",
    menuCategories: ["Pizzas", "Entrées", "Desserts"],
    menu: [
      { id: "margherita", name: "Margherita", description: "Tomate, mozzarella, basilic", price: 16, emoji: "🍕", tone: "rose", category: "Pizzas" },
      { id: "diavola", name: "Diavola", description: "Salami piquant, mozzarella", price: 19, emoji: "🍕", tone: "orange", category: "Pizzas" },
      { id: "funghi", name: "Funghi", description: "Champignons, thym, parmesan", price: 18, emoji: "🍕", tone: "mint", category: "Pizzas" },
      { id: "burrata", name: "Burrata", description: "Tomates de saison, basilic", price: 14, emoji: "🥗", tone: "blue", category: "Entrées" },
    ],
  },
  {
    id: "miso-co",
    name: "Miso & Co.",
    emoji: "🍜",
    tone: "blue",
    cuisine: "Japonais",
    categories: ["Japonais", "Asiatique"],
    price: 2,
    rating: 4.7,
    distanceKm: 1.8,
  },
  {
    id: "green-corner",
    name: "Green Corner",
    emoji: "🥗",
    tone: "mint",
    cuisine: "Salades",
    categories: ["Salades", "Végétarien"],
    price: 1,
    rating: 4.5,
    distanceKm: 2.1,
  },
];

export const getRestaurant = (id?: string) => RESTAURANTS.find((r) => r.id === id);

export type MapPinData = {
  id: string;
  emoji: string;
  x: number;
  y: number;
  orange?: boolean;
  restaurantId?: string;
};

// Coordonnées en px sur un canevas de 390 de large (kit Figma).
export const MAP_PINS: MapPinData[] = [
  { id: "p0", emoji: "🍕", x: 75, y: 230, restaurantId: "forno-verde" },
  { id: "p1", emoji: "🍜", x: 176, y: 142, restaurantId: "miso-co" },
  { id: "p2", emoji: "🥗", x: 286, y: 239, restaurantId: "green-corner" },
  { id: "p3", emoji: "☕", x: 112, y: 405, orange: true },
  { id: "p4", emoji: "🍔", x: 300, y: 522 },
];
