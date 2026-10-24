import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import type { TabKey } from "@/lib/routes";

const TABS: { key: TabKey; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "decouvrir", label: "Découvrir", icon: "home" },
  { key: "carte", label: "Carte", icon: "crosshair" },
  { key: "favoris", label: "Favoris", icon: "heart" },
  { key: "profil", label: "Profil", icon: "list" },
];

type Props = {
  active: TabKey | null;
  onNavigate: (key: TabKey) => void;
};

export function BottomNav({ active, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row border-t border-line bg-white"
      style={{ height: 69 + insets.bottom, paddingBottom: insets.bottom }}
    >
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onNavigate(t.key)}
            className="flex-1 items-center justify-center"
          >
            <Feather name={t.icon} size={20} color={on ? "#174D38" : "#748078"} />
            <Text
              className={`mt-[6px] text-[10px] ${on ? "font-inter-semibold text-forest-700" : "text-muted"}`}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
