// src/app/workout/[id].tsx — просмотр тренировки из истории (только чтение)
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import { useDataVersion } from '@/context/DataVersionContext';
import { EXERCISE_TYPE_ICONS } from '@/constants/exerciseIcons';
import * as WorkoutRepo from '@/db/workouts';
import { useOpenWorkoutInEditor } from '@/hooks/useOpenWorkoutInEditor';
import { useTheme } from '@/theme/ThemeContext';
import { formatLongDate } from '@/utils/date';
import {
    exportWorkout,
    type SingleWorkoutExportFormat,
} from '@/utils/exportHistory';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WorkoutPreviewScreen() {
    const colors = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { workoutsRevision } = useDataVersion();
    const openInEditor = useOpenWorkoutInEditor();
    const dialog = useDialog();

    const workout = useMemo(() => {
        // Ревизия меняется при любой записи тренировок — перечитываем после правки/удаления
        void workoutsRevision;
        return WorkoutRepo.getWorkoutById(Number(id));
    }, [id, workoutsRevision]);

    const summary = useMemo(() => {
        if (!workout) return null;
        let sets = 0;
        let tonnage = 0;
        for (const ex of workout.exercises) {
            sets += ex.sets.length;
            if (ex.type === 'weighted') {
                for (const s of ex.sets) tonnage += s.reps * s.weight;
            }
        }
        return { sets, tonnage: Math.round(tonnage) };
    }, [workout]);

    const handleExportPress = useCallback(() => {
        if (!workout) return;
        const run = async (format: SingleWorkoutExportFormat) => {
            try {
                await exportWorkout(workout, format);
            } catch (e) {
                dialog.show({
                    title: 'Ошибка',
                    message:
                        e instanceof Error
                            ? e.message
                            : 'Не удалось экспортировать',
                });
            }
        };
        dialog.show({
            title: 'Экспорт тренировки',
            message:
                'Текст — чтобы отправить в мессенджер. CSV и JSON можно импортировать обратно.',
            buttons: [
                { text: 'Текст', onPress: () => run('text') },
                { text: 'CSV', onPress: () => run('csv') },
                { text: 'JSON', onPress: () => run('json') },
                { text: 'Отмена', style: 'cancel' },
            ],
        });
    }, [workout, dialog]);

    const headerOptions = {
        headerShown: true,
        title: workout?.name ?? 'Тренировка',
        headerBackTitle: 'История',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
    };

    if (!workout || !summary) {
        return (
            <View
                style={[
                    styles.container,
                    styles.center,
                    { backgroundColor: colors.background },
                ]}
            >
                <Stack.Screen options={headerOptions} />
                <Text style={{ color: colors.textSecondary }}>
                    Тренировка не найдена — возможно, она удалена
                </Text>
            </View>
        );
    }

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen
                options={{
                    ...headerOptions,
                    headerRight: () => (
                        <View style={styles.headerActions}>
                            <Pressable
                                onPress={handleExportPress}
                                hitSlop={10}
                                accessibilityRole="button"
                                accessibilityLabel="Экспорт"
                            >
                                <Ionicons
                                    name="share-outline"
                                    size={24}
                                    color={colors.textPrimary}
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => openInEditor(workout)}
                                hitSlop={10}
                                accessibilityRole="button"
                                accessibilityLabel="Редактировать"
                            >
                                <Ionicons
                                    name="create-outline"
                                    size={24}
                                    color={colors.textPrimary}
                                />
                            </Pressable>
                        </View>
                    ),
                }}
            />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.meta}>
                    <Text style={[styles.date, { color: colors.textPrimary }]}>
                        {formatLongDate(workout.date)}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>
                        {workout.exercises.length} упр. · {summary.sets} подх.
                        {summary.tonnage > 0
                            ? ` · ${summary.tonnage.toLocaleString('ru-RU')} кг`
                            : ''}
                    </Text>
                    {workout.comment ? (
                        <Text
                            style={[
                                styles.workoutComment,
                                { color: colors.textPrimary },
                            ]}
                        >
                            {workout.comment}
                        </Text>
                    ) : null}
                </View>

                {workout.exercises.map((ex) => (
                    <View
                        key={ex.id}
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.colorBar,
                                { backgroundColor: ex.color },
                            ]}
                        />
                        <View style={styles.body}>
                            <View style={styles.header}>
                                <Ionicons
                                    name={EXERCISE_TYPE_ICONS[ex.type]}
                                    size={18}
                                    color={colors.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.name,
                                        { color: colors.textPrimary },
                                    ]}
                                >
                                    {ex.name}
                                </Text>
                            </View>
                            {ex.sets.map((s, i) => (
                                <View key={s.id} style={styles.setRow}>
                                    <Text
                                        style={[
                                            styles.setIndex,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        {i + 1}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.setValue,
                                            { color: colors.textPrimary },
                                        ]}
                                    >
                                        {s.reps}
                                        <Text
                                            style={{
                                                color: colors.textSecondary,
                                            }}
                                        >
                                            {' '}
                                            повт.
                                        </Text>
                                    </Text>
                                    {ex.type !== 'bodyweight' && (
                                        <Text
                                            style={[
                                                styles.setValue,
                                                { color: colors.textPrimary },
                                            ]}
                                        >
                                            {s.weight}
                                            <Text
                                                style={{
                                                    color: colors.textSecondary,
                                                }}
                                            >
                                                {' '}
                                                кг
                                                {ex.type === 'assisted'
                                                    ? ' помощи'
                                                    : ''}
                                            </Text>
                                        </Text>
                                    )}
                                </View>
                            ))}
                            {ex.comment ? (
                                <View style={styles.commentRow}>
                                    <Ionicons
                                        name="chatbubble-outline"
                                        size={14}
                                        color={colors.textSecondary}
                                    />
                                    <Text
                                        style={[
                                            styles.comment,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        {ex.comment}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                ))}

                <Pressable
                    onPress={() => openInEditor(workout)}
                    style={[
                        styles.editButton,
                        { backgroundColor: colors.accent },
                    ]}
                >
                    <Ionicons
                        name="create-outline"
                        size={20}
                        color={colors.textInverse}
                    />
                    <Text
                        style={{ color: colors.textInverse, fontWeight: '600' }}
                    >
                        Редактировать
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
    content: { padding: 16, gap: 10, paddingBottom: 40 },
    meta: { gap: 4, marginBottom: 6 },
    date: { fontSize: 17, fontWeight: '600' },
    workoutComment: { fontSize: 15, marginTop: 6, lineHeight: 21 },
    card: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
    },
    colorBar: { width: 5 },
    body: { flex: 1, padding: 14, gap: 6 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    name: { flex: 1, fontSize: 16, fontWeight: '600' },
    setRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    setIndex: {
        width: 18,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    setValue: { flex: 1, fontSize: 16, fontWeight: '700' },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 4,
    },
    comment: { flex: 1, fontSize: 13, fontStyle: 'italic' },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 50,
        borderRadius: 12,
        marginTop: 8,
    },
});
