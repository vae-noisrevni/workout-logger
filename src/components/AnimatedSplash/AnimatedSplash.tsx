// src/components/AnimatedSplash/AnimatedSplash.tsx
import { darkTheme, lightTheme } from '@/theme/colors';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, useColorScheme } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SplashScreen } from 'expo-router';

// Размеры подогнаны под нативный сплэш (splash-icon.png: штанга 560 из 1024 при imageWidth 200),
// чтобы переход от нативного экрана к анимированному не был заметен
const BAR_WIDTH = (200 * 560) / 1024;
const BAR_HEIGHT = BAR_WIDTH * (235 / 864);
const LIFT = 28;
const MIN_DURATION = 1900;
const FADE_OUT = 350;

interface Props {
    /** Приложение готово показываться (БД инициализирована) */
    ready: boolean;
    onFinish: () => void;
}

export function AnimatedSplash({ ready, onFinish }: Props) {
    // Нативный сплэш следует системной теме, поэтому и здесь берём её, а не тему приложения
    const isLight = useColorScheme() === 'light';
    const palette = isLight ? lightTheme : darkTheme;
    const [minDone, setMinDone] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const lift = useSharedValue(0);
    const title = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        // Два повтора «подъёма штанги» и упругое опускание
        lift.value = withDelay(
            250,
            withSequence(
                withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
                withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }),
                withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
                withSpring(0, { damping: 7, stiffness: 160 }),
            ),
        );
        title.value = withDelay(
            600,
            withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
        );
        const timer = setTimeout(() => setMinDone(true), MIN_DURATION);
        return () => clearTimeout(timer);
    }, [lift, title]);

    useEffect(() => {
        if (!minDone || !ready) return;
        setLeaving(true);
        opacity.value = withTiming(0, { duration: FADE_OUT });
        const timer = setTimeout(onFinish, FADE_OUT);
        return () => clearTimeout(timer);
    }, [minDone, ready, onFinish, opacity]);

    const barStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: -LIFT * lift.value },
            { scale: 1 + 0.1 * lift.value },
        ],
    }));
    const shadowStyle = useAnimatedStyle(() => ({
        opacity: 0.2 - 0.12 * lift.value,
        transform: [{ scaleX: 1 - 0.3 * lift.value }],
    }));
    const titleStyle = useAnimatedStyle(() => ({
        opacity: title.value,
        transform: [{ translateY: 14 * (1 - title.value) }],
    }));
    const rootStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            pointerEvents={leaving ? 'none' : 'auto'}
            // Скрываем нативный сплэш только когда анимированный уже нарисован — без вспышки
            onLayout={() => SplashScreen.hideAsync().catch(() => {})}
            style={[styles.root, { backgroundColor: palette.background }, rootStyle]}
        >
            <Animated.View style={barStyle}>
                <Image
                    source={require('../../../assets/images/barbell.png')}
                    style={{ width: BAR_WIDTH, height: BAR_HEIGHT }}
                    resizeMode="contain"
                />
            </Animated.View>
            <Animated.View
                style={[
                    styles.shadow,
                    { width: BAR_WIDTH * 0.8 },
                    shadowStyle,
                ]}
            />
            <Animated.View style={[styles.titleWrap, titleStyle]}>
                <Text style={[styles.title, { color: palette.textPrimary }]}>
                    Workout Logger
                </Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    shadow: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#000',
        marginTop: 8,
    },
    titleWrap: { position: 'absolute', bottom: '32%' },
    title: { fontSize: 22, fontWeight: '700', letterSpacing: 1.5 },
});
