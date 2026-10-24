import { Redirect } from "expo-router";
import { useApp } from "@/store/AppContext";
import { TAB_HREF } from "@/lib/routes";

export default function Index() {
  const { onboarded } = useApp();
  return <Redirect href={onboarded ? TAB_HREF.decouvrir : "/onboarding"} />;
}
