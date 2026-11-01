// src/app/(tabs)/history.tsx
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import { useDataVersion } from '@/context/DataVersionContext';
import { useWorkoutDraftContext } from '@/context/WorkoutDraftContext';
import * as WorkoutRepo from '@/db/workouts';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useTheme } from '@/theme/ThemeContext';
import { formatLongDate } from '@/utils/date';
import { exportHistory, type ExportFormat } from '@/utils/exportHistory';
import { pickTextFile } from '@/utils/fileTransfer';
import { parseWorkouts } from '@/utils/importHistory';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import type { Workout } from '@/types/workouts';

export default function HistoryScreen() {
    const colors = useTheme();
    const { workouts, remove } = useWorkouts();
    const draft = useWorkoutDraftContext();
    const dialog = useDialog();
    const { bumpWorkouts } = useDataVersion();
    // Открытая свайпом карточка — чтобы закрыть её, если пользователь отменил удаление
    const swipeRefs = useRef<Record<number, Swipeable | null>>({});

    const handleExport = useCallback(
        async (format: ExportFormat) => {
            try {
                await exportHistory(workouts, format);
            } catch (e) {
                dialog.show({
                    title: 'Ошибка',
                    message:
                        e instanceof Error
                            ? e.message
                            : 'Не удалось экспортировать',
                });
            }
        },
        [workouts, dialog],
    );

    const handleExportPress = useCallback(() => {
        dialog.show({
            title: 'Экспорт истории',
            message: 'Выбери формат файла',
            buttons: [
                { text: 'CSV', onPress: () => handleExport('csv') },
                { text: 'JSON', onPress: () => handleExport('json') },
                { text: 'Отмена', style: 'cancel' },
            ],
        });
    }, [handleExport, dialog]);

    const handleImportPress = useCallback(async () => {
        try {
            const file = await pickTextFile();
            if (!file) return;
            const { added, skipped } = WorkoutRepo.importWorkouts(
                parseWorkouts(file.text, file.format),
            );
            bumpWorkouts();
            dialog.show({
                title: 'Импорт завершён',
                message:
                    `Добавлено тренировок: ${added}` +
                    (skipped > 0
                        ? `\nПропущено (уже есть с такой датой и названием): ${skipped}`
                        : ''),
            });
        } catch (e) {
            dialog.show({
                title: 'Не удалось импортировать',
                message: e instanceof Error ? e.message : 'Неизвестная ошибка',
            });
        }
    }, [dialog, bumpWorkouts]);

    const handleWorkoutPress = useCallback((workout: Workout) => {
        router.push({
            pathname: '/workout/[id]',
            params: { id: String(workout.id) },
        });
    }, []);

    const handleDelete = useCallback(
        (workout: Workout) => {
            dialog.show({
                title: 'Удалить тренировку?',
                message: `«${workout.name}» будет удалена из истории без возможности восстановления.`,
                buttons: [
                    {
                        text: 'Отмена',
                        style: 'cancel',
                        onPress: () => swipeRefs.current[workout.id]?.close(),
                    },
                    {
                        text: 'Удалить',
                        style: 'destructive',
                        onPress: () => {
                            // Если эту тренировку правили на экране тренировки — сбрасываем режим редактирования
                            if (draft.editing?.id === workout.id) draft.reset();
                            remove(workout.id);
                        },
                    },
                ],
            });
        },
        [dialog, draft, remove],
    );

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <FlatList
                data={workouts}
                keyExtractor={(w) => String(w.id)}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text
                        style={[styles.empty, { color: colors.textSecondary }]}
                    >
                        История пока пуста
                    </Text>
                }
                ListHeaderComponent={
                    <View style={styles.transferRow}>
                        <Pressable
                            onPress={handleExportPress}
                            disabled={workouts.length === 0}
                            style={[
                                styles.exportBtn,
                                {
                                    borderColor: colors.accent,
                                    opacity: workouts.length === 0 ? 0.4 : 1,
                                },
                            ]}
                        >
                            <Ionicons
                                name="download-outline"
                                size={20}
                                color={colors.accent}
                            />
                            <Text
                                style={{
                                    color: colors.accent,
                                    fontWeight: '600',
                                }}
                            >
                                Экспорт
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={handleImportPress}
                            style={[
                                styles.exportBtn,
                                { borderColor: colors.accent },
                            ]}
                        >
                            <Ionicons
                                name="push-outline"
                                size={20}
                                color={colors.accent}
                            />
                            <Text
                                style={{
                                    color: colors.accent,
                                    fontWeight: '600',
                                }}
                            >
                                Импорт
                            </Text>
                        </Pressable>
                    </View>
                }
                renderItem={({ item }) => {
                    const setsCount = item.exercises.reduce(
                        (sum, ex) => sum + ex.sets.length,
                        0,
                    );
                    return (
                        <Swipeable
                            ref={(r) => {
                                swipeRefs.current[item.id] = r;
                            }}
                            renderRightActions={() => (
                                <Pressable
                                    onPress={() => handleDelete(item)}
                                    style={[
                                        styles.deleteAction,
                                        { backgroundColor: colors.danger },
                                    ]}
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={22}
                                        color="#fff"
                                    />
                                </Pressable>
                            )}
                            overshootRight={false}
                            rightThreshold={40}
                        >
                        <Pressable
                            onPress={() => handleWorkoutPress(item)}
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
                                    name="chevron-forward"
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </View>
                            <Text style={{ color: colors.textSecondary }}>
                                {formatLongDate(item.date)} · {item.exercises.length}{' '}
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
                        </Swipeable>
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
    transferRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
    empty: { textAlign: 'center', marginTop: 40 },
    exportBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    card: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { flex: 1, fontSize: 16, fontWeight: '600' },
    deleteAction: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        marginLeft: 8,
    },
    dots: { flexDirection: 'row', gap: 6, marginTop: 2 },
    dot: { width: 10, height: 10, borderRadius: 5 },
});
