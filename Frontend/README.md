# À Table — Restaurant Finder (Expo + NativeWind)

## Installation

```bash
npx create-expo-app@latest restaurant-finder
cd restaurant-finder

npx expo install nativewind react-native-reanimated react-native-worklets react-native-safe-area-context \
  expo-location expo-font expo-splash-screen expo-status-bar @expo/vector-icons @expo-google-fonts/inter
npm i -D tailwindcss@^3.4.17
```

Copie ensuite les fichiers de ce dossier à la racine du projet (remplace `babel.config.js`, `metro.config.js`, `app/`).
Supprime les écrans du template (`app/(tabs)/index.tsx`, `explore.tsx`, etc.).

Dans `app.json` :

```json
{ "expo": { "plugins": ["expo-router", ["expo-location", { "locationWhenInUsePermission": "Utilise ta position pour trouver les restaurants proches." }]] } }
```

```bash
npx expo start -c
```

## Structure

- `app/onboarding.tsx` — 08 Onboarding localisation
- `app/(tabs)/decouvrir.tsx` — 01 Découvrir / Liste (+ 09 Aucun résultat via `components/NoResults.tsx`)
- `app/(tabs)/carte.tsx` — 02 Carte interactive
- `app/filtres.tsx` — 03 Filtres (bottom sheet)
- `app/restaurant/[id]/index.tsx` — 04 Fiche restaurant
- `app/restaurant/[id]/menu.tsx` — 05 Menu restaurant
- `app/(tabs)/favoris.tsx` — 06 Favoris
- `app/(tabs)/profil.tsx` — 07 Paramètres
- `components/` — Button, IconButton, SearchField, Chip, Badge, Checkbox, Slider, RestaurantCard, MenuItem, RadiusSelector, MapPin, BottomNav, SettingRow, NoResults
- `data/restaurants.ts` — données d’exemple du kit


## Connexion au backend À Table

Le frontend consomme maintenant les routes `/api/v1/restaurants/nearby`, `/api/v1/restaurants/search` et `/api/v1/restaurants/wikidata/:entityId`.

1. Copie `.env.example` en `.env`.
2. Configure `EXPO_PUBLIC_API_URL` :
   - Émulateur Android : `http://10.0.2.2:4000/api/v1`
   - Téléphone physique : `http://IP_LOCALE_DU_PC:4000/api/v1` (PC et téléphone sur le même Wi-Fi)
   - Backend déployé : URL publique du backend terminant par `/api/v1`.
3. Démarre le backend dans `Backend` avec `npm run dev`.
4. Redémarre Expo avec `npx expo start -c` après toute modification de `.env`.

La découverte, la recherche textuelle, le rayon, les filtres, les favoris de session, la fiche détaillée et l’enrichissement Wikidata utilisent les données de l’API. OpenStreetMap ne fournit généralement ni notes, ni prix, ni menus structurés ; l’interface les marque comme inconnus au lieu d’inventer des valeurs. La carte actuelle est une visualisation schématique des coordonnées réelles, pas encore un fond cartographique routier.
