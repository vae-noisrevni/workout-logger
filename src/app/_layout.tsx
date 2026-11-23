import { Text } from '@/components/Typography/Typography';
import { useFonts } from 'expo-font';
import { bodyFonts, headingFont } from '@/theme/typography';
import { DataQueryProvider } from '@/query/client';
// src/app/_layout.tsx
import { AnimatedSplash } from '@/components/AnimatedSplash/AnimatedSplash';
import { AndroidStatusBar } from '@/components/AndroidStatusBar/AndroidStatusBar';
import { DialogProvider } from '@/components/ConfirmDialog/DialogProvider';
import { WorkoutDraftProvider } from '@/context/WorkoutDraftContext';
import { initializeDatabase } from '@/db/init';
import { ThemeProvider } from '@/theme/ThemeContext';
import { SplashScreen, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Нативный сплэш держим, пока не отрисуется анимированный (см. AnimatedSplash)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        [headingFont]: require('../../assets/fonts/Unbounded.ttf'),
        [bodyFonts.regular]: require('../../assets/fonts/Onest_400Regular.ttf'),
        [bodyFonts.medium]: require('../../assets/fonts/Onest_500Medium.ttf'),
        [bodyFonts.semibold]: require('../../assets/fonts/Onest_600SemiBold.ttf'),
        [bodyFonts.bold]: require('../../assets/fonts/Onest_700Bold.ttf'),
    });
    const [dbReady, setDbReady] = useState(false);
    const [dbError, setDbError] = useState<string | null>(null);
    const [splashDone, setSplashDone] = useState(false);
    const finishSplash = useCallback(() => setSplashDone(true), []);

    useEffect(() => {
        initializeDatabase()
            .then(() => setDbReady(true))
            .catch((e) =>
                setDbError(e instanceof Error ? e.message : 'DB error'),
            );
    }, []);

    const fontsReady = fontsLoaded || fontError !== null;
    const content = dbError ? (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Text>Ошибка БД: {dbError}</Text>
        </View>
    ) : dbReady && fontsReady ? (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ThemeProvider>
                            <DialogProvider>
                              <DataQueryProvider>
                                <WorkoutDraftProvider>
                                    <Stack
                                        screenOptions={{ headerShown: false }}
                                    />
                                    <AndroidStatusBar />
                                </WorkoutDraftProvider>
                              </DataQueryProvider>
                            </DialogProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    ) : null;

    return (
        <View style={{ flex: 1 }}>
            {content}
            {!splashDone && (
                <AnimatedSplash
                    ready={(dbReady && fontsReady) || dbError !== null}
                    onFinish={finishSplash}
                />
            )}
        </View>
    );
}
