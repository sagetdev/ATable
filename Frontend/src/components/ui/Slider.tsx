import { useRef, useState } from "react";
import { PanResponder, View } from "react-native";

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
};

export function Slider({ value, min, max, step = 1, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const propsRef = useRef({ min, max, step, onChange });
  propsRef.current = { min, max, step, onChange };

  const update = (x: number) => {
    const w = widthRef.current;
    if (!w) return;
    const { min: lo, max: hi, step: st, onChange: cb } = propsRef.current;
    const ratio = Math.min(1, Math.max(0, x / w));
    const stepped = Math.round((lo + ratio * (hi - lo)) / st) * st;
    cb(Math.min(hi, Math.max(lo, Number(stepped.toFixed(2)))));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    })
  ).current;

  const ratio = max === min ? 0 : (value - min) / (max - min);

  return (
    <View
      className="h-[28px] justify-center"
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      {...pan.panHandlers}
    >
      <View pointerEvents="none" className="h-[5px] rounded-[3px] bg-line" />
      <View
        pointerEvents="none"
        className="absolute left-0 h-[5px] rounded-[3px] bg-forest-700"
        style={{ width: ratio * width }}
      />
      <View
        pointerEvents="none"
        className="absolute top-[4px] size-[20px] rounded-full border border-forest-700 bg-white"
        style={{ left: ratio * width - 10 }}
      />
    </View>
  );
}
