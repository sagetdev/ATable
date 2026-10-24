import { Pressable, PressableProps } from "react-native";
import { ReactNode } from "react";
import { Text } from "./Text";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
};

export function Button({ label, onPress, variant = "primary", className = "" }: ButtonProps) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      className={`h-[54px] items-center justify-center rounded-[17px] active:opacity-80 ${
        primary ? "bg-forest-700" : "border border-line bg-white"
      } ${className}`}
    >
      <Text className={`text-[14px] font-inter-semibold ${primary ? "text-white" : "text-ink"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

type IconButtonProps = PressableProps & { children: ReactNode; className?: string };

export function IconButton({ children, className = "", ...rest }: IconButtonProps) {
  return (
    <Pressable
      className={`size-[52px] items-center justify-center rounded-[16px] bg-lime-300 active:opacity-80 ${className}`}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
