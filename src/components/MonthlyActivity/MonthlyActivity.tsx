import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, AppState, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { activityColor } from '@/utils/stats';

export function MonthlyActivity({ count, children }: { count: number; children: ReactNode }) {
    const colors = useTheme();
    const [opacity] = useState(() => new Animated.Value(0.08));
    const [reduced, setReduced] = useState(true);
    useEffect(() => {
        let cancelled = false;
        const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
        AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (!cancelled) setReduced(value); }).catch(() => {});
        return () => { cancelled = true; subscription.remove(); };
    }, []);
    useFocusEffect(useCallback(() => {
        let animation: Animated.CompositeAnimation | null = null;
        const stop = () => { animation?.stop(); animation = null; opacity.setValue(0.08); };
        const start = () => {
            stop();
            if (reduced || AppState.currentState !== 'active') return;
            animation = Animated.loop(Animated.sequence([
                Animated.timing(opacity, { toValue: 0.22, duration: 280, useNativeDriver: true, isInteraction: false }),
                Animated.timing(opacity, { toValue: 0.10, duration: 180, useNativeDriver: true, isInteraction: false }),
                Animated.timing(opacity, { toValue: 0.18, duration: 220, useNativeDriver: true, isInteraction: false }),
                Animated.timing(opacity, { toValue: 0.08, duration: 1000, useNativeDriver: true, isInteraction: false }),
                Animated.delay(800),
            ]));
            animation.start();
        };
        start();
        const subscription = AppState.addEventListener('change', (state) => state === 'active' ? start() : stop());
        return () => { subscription.remove(); stop(); };
    }, [opacity, reduced]));
    return <View style={{ padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border,
        backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' }}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: activityColor(count), opacity }]} />
        {children}
    </View>;
}
