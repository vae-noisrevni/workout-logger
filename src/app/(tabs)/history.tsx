import { Text } from '@/components/Typography/Typography';
import { ListSearchHeader } from '@/components/ListSearchHeader/ListSearchHeader';
import { FlatList } from 'react-native-gesture-handler';
// src/app/(tabs)/history.tsx
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import { useWorkoutDraftContext } from '@/context/WorkoutDraftContext';
import { useWorkoutWrites } from '@/hooks/useDataQueries';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useTheme } from '@/theme/ThemeContext';
import { exportHistory, type ExportFormat } from '@/utils/exportHistory';
import { pickTextFile } from '@/utils/fileTransfer';
import { parseWorkouts } from '@/utils/importHistory';
import { formatWorkoutDate, formatWorkoutWeekday } from '@/utils/date';
import { searchWorkoutHistory } from '@/utils/history';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SwipeToDelete } from '@/components/SwipeToDelete/SwipeToDelete';

import type { Workout } from '@/types/workouts';

export default function HistoryScreen() {
    const colors = useTheme();
    const { workouts, remove } = useWorkouts();
    const [search, setSearch] = useState('');
    const results = useMemo(
        () => searchWorkoutHistory(workouts, search),
        [workouts, search],
    );
    const draft = useWorkoutDraftContext();
    const dialog = useDialog();
    const { importData } = useWorkoutWrites();

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
            const { added, skipped } = await importData(
                parseWorkouts(file.text, file.format),
            );
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
    }, [dialog, importData]);

    const openInEditor = useCallback(
        (workout: Workout) => {
            draft.loadWorkout(workout);
            router.navigate('/');
        },
        [draft],
    );

    const handleWorkoutPress = useCallback(
        (workout: Workout) => {
            if (!draft.hydrated) return;
            const hasCurrent = draft.draft.length > 0 || draft.editing !== null;
            if (!hasCurrent) {
                openInEditor(workout);
                return;
            }
            dialog.show({
                title: 'Заменить текущую тренировку?',
                message: draft.editing
                    ? 'Сейчас редактируется другая тренировка. Несохранённые изменения будут потеряны.'
                    : 'На экране тренировки уже есть несохранённые упражнения. Они будут заменены выбранной тренировкой из истории.',
                buttons: [
                    { text: 'Оставить текущую', style: 'cancel' },
                    {
                        text: 'Заменить',
                        style: 'destructive',
                        onPress: () => openInEditor(workout),
                    },
                ],
            });
        },
        [draft.hydrated, draft.draft.length, draft.editing, dialog, openInEditor],
    );

    const handleDelete = useCallback(
        (workout: Workout) => {
            dialog.show({
                title: 'Удалить тренировку?',
                message: `«${workout.name}» будет удалена из истории без возможности восстановления.`,
                buttons: [
                    {
                        text: 'Отмена',
                        style: 'cancel',
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
            <ListSearchHeader search={search} onSearchChange={setSearch}
                placeholder="Поиск по упражнению" actions={[
                    { id: 'import', icon: 'arrow-down-outline', title: 'Импорт', onPress: handleImportPress },
                    { id: 'export', icon: 'arrow-up-outline', title: 'Экспорт', onPress: handleExportPress, disabled: workouts.length === 0 },
                ]} />
            <FlatList
                data={results}
                keyExtractor={({ workout }) => String(workout.id)}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text
                        style={[styles.empty, { color: colors.textSecondary }]}
                    >
                        {workouts.length === 0 ? 'История пока пуста' : 'Ничего не найдено'}
                    </Text>
                }
                renderItem={({ item: { workout: item, matchingNames } }) => {
                    const setsCount = item.exercises.reduce(
                        (sum, ex) => sum + ex.sets.length,
                        0,
                    );
                    return (
                        <SwipeToDelete radius={14} onDelete={() => handleDelete(item)}>
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
                                    name="create-outline"
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </View>
                            <Text style={{ color: colors.textSecondary }}>
                                {formatWorkoutDate(item.date)}{'\u00a0\u00a0\u00a0'}{formatWorkoutWeekday(item.date)} · {item.exercises.length}{' '}
                                упр. · {setsCount} подх.
                            </Text>
                            {matchingNames.length > 0 && (
                                <Text style={{ color: colors.textPrimary }}>
                                    {matchingNames.join(', ')}
                                </Text>
                            )}
                            {item.preset_name && <Text style={{ color: colors.textSecondary }}>Пресет: {item.preset_name}</Text>}
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
                        </SwipeToDelete>
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
    empty: { textAlign: 'center', marginTop: 40 },
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
