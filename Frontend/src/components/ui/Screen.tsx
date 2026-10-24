import { View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = ViewProps & { className?: string };

export function Screen({ children, className = "", style, ...rest }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={`flex-1 bg-canvas-50 ${className}`}
      style={[{ paddingTop: insets.top }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
