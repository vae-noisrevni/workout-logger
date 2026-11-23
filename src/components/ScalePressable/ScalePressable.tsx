import { useRef } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const motion = { duration: 120, reduceMotion: ReduceMotion.System };

export function ScalePressable({ style, disabled, onPressIn, onPressOut, onHoverIn, onHoverOut,
    pressedScale = 0.96, ...props }: Omit<PressableProps, 'style'> & { pressedScale?: number; style?: StyleProp<ViewStyle> }) {
    const scale = useSharedValue(1);
    const hovered = useRef(false);
    const held = useRef(false);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: disabled ? 1 : scale.value }] }));

    return <AnimatedPressable {...props} disabled={disabled}
        style={[style, animatedStyle]}
        onPressIn={(event) => {
            held.current = true;
            scale.set(withTiming(pressedScale, motion));
            onPressIn?.(event);
        }}
        onPressOut={(event) => {
            held.current = false;
            scale.set(withTiming(hovered.current ? 1.02 : 1, motion));
            onPressOut?.(event);
        }}
        onHoverIn={(event) => {
            hovered.current = true;
            if (!held.current) scale.set(withTiming(1.02, motion));
            onHoverIn?.(event);
        }}
        onHoverOut={(event) => {
            hovered.current = false;
            if (!held.current) scale.set(withTiming(1, motion));
            onHoverOut?.(event);
        }}
    />;
}
