
export type Restaurant = {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  priceLevel: 1 | 2 | 3 | 4;
  rating: number;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  isOpen: boolean;
};

export const restaurants: Restaurant[] = [
  {
    id: "demo-1",
    name: "Le Jardin Gourmand",
    description: "Cuisine de saison et produits frais.",
    cuisine: "Française",
    priceLevel: 3,
    rating: 4.6,
    latitude: 45.5017,
    longitude: -73.5673,
    imageUrl: null,
    isOpen: true,
  },
  {
    id: "demo-2",
    name: "Casa Napoli",
    description: "Pizzas et spécialités italiennes.",
    cuisine: "Italienne",
    priceLevel: 2,
    rating: 4.4,
    latitude: 45.5088,
    longitude: -73.554,
    imageUrl: null,
    isOpen: true,
  },
  {
    id: "demo-3",
    name: "Tokyo Bento",
    description: "Cuisine japonaise et bols de riz.",
    cuisine: "Japonaise",
    priceLevel: 2,
    rating: 4.7,
    latitude: 45.4972,
    longitude: -73.579,
    imageUrl: null,
    isOpen: false,
  },
  {
    id: "demo-4",
    name: "Green Fork",
    description: "Plats végétariens et options végétales.",
    cuisine: "Végétarienne",
    priceLevel: 1,
    rating: 4.3,
    latitude: 45.515,
    longitude: -73.561,
    imageUrl: null,
    isOpen: true,
  },
  {
    id: "demo-5",
    name: "Taco Barrio",
    description: "Tacos et cuisine mexicaine.",
    cuisine: "Mexicaine",
    priceLevel: 2,
    rating: 4.5,
    latitude: 45.504,
    longitude: -73.571,
    imageUrl: null,
    isOpen: true,
  },
];
