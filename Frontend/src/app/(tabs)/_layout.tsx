import { Tabs } from "expo-router";
import { BottomNav } from "@/components/BottomNav";
import type { TabKey } from "@/lib/routes";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <BottomNav
          active={props.state.routes[props.state.index].name as TabKey}
          onNavigate={(key) => props.navigation.navigate(key)}
        />
      )}
    >
      <Tabs.Screen name="decouvrir" />
      <Tabs.Screen name="carte" />
      <Tabs.Screen name="favoris" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
