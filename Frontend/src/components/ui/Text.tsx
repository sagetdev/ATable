import { Text as RNText, TextProps } from "react-native";

type Props = TextProps & { className?: string };

export function Text({ className = "", ...props }: Props) {
  const font = /font-inter/.test(className) ? "" : "font-inter";
  const color = /text-(ink|muted|white|forest|lime|sage|accent)/.test(className) ? "" : "text-ink";
  return <RNText className={`${font} ${color} ${className}`} {...props} />;
}
