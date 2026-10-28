// src/app/_layout.tsx
import { AnimatedSplash } from '@/components/AnimatedSplash/AnimatedSplash';
import { DialogProvider } from '@/components/ConfirmDialog/DialogProvider';
import { DataVersionProvider } from '@/context/DataVersionContext';
import { WorkoutDraftProvider } from '@/context/WorkoutDraftContext';
import { WorkoutsVersionProvider } from '@/context/WorkoutsVersionContext';
import { initializeDatabase } from '@/db/init';
import { ThemeProvider } from '@/theme/ThemeContext';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Нативный сплэш держим, пока не отрисуется анимированный (см. AnimatedSplash)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
    const [dbReady, setDbReady] = useState(false);
    const [dbError, setDbError] = useState<string | null>(null);
    const [splashDone, setSplashDone] = useState(false);

    useEffect(() => {
        initializeDatabase()
            .then(() => setDbReady(true))
            .catch((e) =>
                setDbError(e instanceof Error ? e.message : 'DB error'),
            );
    }, []);

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
    ) : dbReady ? (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ThemeProvider>
                    <DataVersionProvider>
                        <WorkoutsVersionProvider>
                            <DialogProvider>
                                <WorkoutDraftProvider>
                                    <Stack
                                        screenOptions={{ headerShown: false }}
                                    />
                                </WorkoutDraftProvider>
                            </DialogProvider>
                        </WorkoutsVersionProvider>
                    </DataVersionProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    ) : null;

    return (
        <View style={{ flex: 1 }}>
            {content}
            {!splashDone && (
                <AnimatedSplash
                    ready={dbReady || dbError !== null}
                    onFinish={() => setSplashDone(true)}
                />
            )}
        </View>
    );
}
