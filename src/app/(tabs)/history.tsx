// src/app/(tabs)/history.tsx
import { useWorkouts } from '@/hooks/useWorkouts';
import { useTheme } from '@/theme/ThemeContext';
import { exportHistory, type ExportFormat } from '@/utils/exportHistory';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

export default function HistoryScreen() {
    const colors = useTheme();
    const { workouts } = useWorkouts();

    const handleExport = useCallback(
        async (format: ExportFormat) => {
            try {
                await exportHistory(workouts, format);
            } catch (e) {
                Alert.alert(
                    'Ошибка',
                    e instanceof Error ? e.message : 'Не удалось экспортировать',
                );
            }
        },
        [workouts],
    );

    const handleExportPress = useCallback(() => {
        Alert.alert('Экспорт истории', 'Выбери формат файла', [
            { text: 'CSV', onPress: () => handleExport('csv') },
            { text: 'JSON', onPress: () => handleExport('json') },
            { text: 'Отмена', style: 'cancel' },
        ]);
    }, [handleExport]);

    if (workouts.length === 0) {
        return (
            <View
                style={[
                    styles.container,
                    styles.center,
                    { backgroundColor: colors.background },
                ]}
            >
                <Text style={{ color: colors.textSecondary }}>
                    История пока пуста
                </Text>
            </View>
        );
    }

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <FlatList
                data={workouts}
                keyExtractor={(w) => String(w.id)}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <Pressable
                        onPress={handleExportPress}
                        style={[styles.exportBtn, { borderColor: colors.accent }]}
                    >
                        <Ionicons
                            name="download-outline"
                            size={20}
                            color={colors.accent}
                        />
                        <Text style={{ color: colors.accent, fontWeight: '600' }}>
                            Экспорт CSV / JSON
                        </Text>
                    </Pressable>
                }
                renderItem={({ item }) => {
                    const setsCount = item.exercises.reduce(
                        (sum, ex) => sum + ex.sets.length,
                        0,
                    );
                    return (
                        <Pressable
                            onPress={() => router.push(`/workout/${item.id}`)}
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.cardHeader}>
                                <Text
                                    numberOfLines={1}
                                    style={[
                                        styles.name,
                                        { color: colors.textPrimary },
                                    ]}
                                >
                                    {item.name}
                                </Text>
                                <Ionicons
                                    name="create-outline"
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </View>
                            <Text style={{ color: colors.textSecondary }}>
                                {formatDate(item.date)} · {item.exercises.length}{' '}
                                упр. · {setsCount} подх.
                            </Text>
                            <View style={styles.dots}>
                                {item.exercises.map((ex) => (
                                    <View
                                        key={ex.id}
                                        style={[
                                            styles.dot,
                                            { backgroundColor: ex.color },
                                        ]}
                                    />
                                ))}
                            </View>
                        </Pressable>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, gap: 10 },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        marginBottom: 6,
    },
    card: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { flex: 1, fontSize: 16, fontWeight: '600' },
    dots: { flexDirection: 'row', gap: 6, marginTop: 2 },
    dot: { width: 10, height: 10, borderRadius: 5 },
});
