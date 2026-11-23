import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const ACTION_WIDTH = 88;

export function SwipeToDelete({ children, onDelete, radius }: {
    children: ReactNode;
    onDelete: () => void;
    radius: number;
}) {
    const colors = useTheme();
    const offset = useSharedValue(0);
    const start = useSharedValue(0);
    const opened = useSharedValue(false);
    const pan = usePanGesture({
        activeOffsetX: [-22, 22],
        failOffsetY: [-10, 10],
        maxPointers: 1,
        onActivate: () => {
            'worklet';
            start.value = opened.value ? -ACTION_WIDTH : 0;
        },
        onUpdate: ({ translationX }) => {
            'worklet';
            offset.value = Math.min(0, Math.max(-ACTION_WIDTH, start.value + translationX));
        },
        onDeactivate: ({ canceled }) => {
            'worklet';
            if (!canceled) opened.value = offset.value <= -ACTION_WIDTH / 2;
            offset.value = withTiming(opened.value ? -ACTION_WIDTH : 0);
        },
    });
    const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
    const actionStyle = useAnimatedStyle(() => ({
        opacity: Math.min(1, -offset.value / 12),
        pointerEvents: opened.value ? 'auto' : 'none',
    }));
    const coverStyle = useAnimatedStyle(() => ({
        pointerEvents: opened.value ? 'auto' : 'none',
    }));
    const actionProps = useAnimatedProps(() => ({
        accessibilityElementsHidden: !opened.value,
        importantForAccessibility: opened.value ? 'auto' as const : 'no-hide-descendants' as const,
    }));
    const close = () => {
        opened.set(false);
        offset.set(withTiming(0));
    };

    return <GestureDetector gesture={pan} touchAction="pan-y">
        <View style={{ overflow: 'hidden', borderRadius: radius }}>
            <Animated.View animatedProps={actionProps} style={[styles.action, actionStyle]}>
                <Pressable accessibilityRole="button" accessibilityLabel="Удалить"
                    onPress={() => { close(); onDelete(); }}
                    style={[styles.button, { backgroundColor: colors.danger, borderRadius: radius }]}>
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                </Pressable>
            </Animated.View>
            <Animated.View style={rowStyle}>
                {children}
                <Animated.View style={[StyleSheet.absoluteFill, coverStyle]}>
                    <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={close} />
                </Animated.View>
            </Animated.View>
        </View>
    </GestureDetector>;
}

const styles = StyleSheet.create({
    action: { position: 'absolute', right: 0, top: 0, bottom: 0, width: ACTION_WIDTH, paddingLeft: 8 },
    button: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
