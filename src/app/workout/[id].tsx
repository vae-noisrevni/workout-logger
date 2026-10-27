// src/app/workout/[id].tsx
import { NumberStepperField } from '@/components/NumberStepperField/NumberStepperField';
import { useDataVersion } from '@/context/DataVersionContext';
import * as WorkoutRepo from '@/db/workouts';
import { useExercises } from '@/hooks/useExercises';
import { useTheme } from '@/theme/ThemeContext';
import type { DraftExercise } from '@/types/workouts';
import { inputDateToIso, isoToInputDate } from '@/utils/date';
import { resolveDraft } from '@/utils/resolveDraft';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const newSetId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function EditWorkoutScreen() {
    const colors = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { bumpWorkouts } = useDataVersion();
    const { exercises: allExercises } = useExercises();

    // Начальное состояние читаем из БД один раз
    const workout = useMemo(() => WorkoutRepo.getWorkoutById(Number(id)), [id]);

    const [name, setName] = useState(workout?.name ?? '');
    const [dateInput, setDateInput] = useState(
        workout ? isoToInputDate(workout.date) : '',
    );
    const [comment, setComment] = useState(workout?.comment ?? '');
    const [dateError, setDateError] = useState<string | null>(null);
    const [items, setItems] = useState<DraftExercise[]>(
        () =>
            workout?.exercises.map((ex) => ({
                exercise_id: ex.exercise_id,
                sets: ex.sets.map((s) => ({
                    id: String(s.id),
                    reps: s.reps,
                    weight: s.weight,
                })),
            })) ?? [],
    );
    const [picking, setPicking] = useState(false);

    const resolved = useMemo(
        () => resolveDraft(items, allExercises),
        [items, allExercises],
    );
    const available = useMemo(() => {
        const used = new Set(items.map((i) => i.exercise_id));
        return allExercises.filter((e) => !used.has(e.id));
    }, [items, allExercises]);

    if (!workout) {
        return (
            <View
                style={[
                    styles.center,
                    { backgroundColor: colors.background },
                ]}
            >
                <Text style={{ color: colors.textSecondary }}>
                    Тренировка не найдена
                </Text>
            </View>
        );
    }

    const patchExercise = (
        exerciseId: number,
        fn: (d: DraftExercise) => DraftExercise,
    ) =>
        setItems((prev) =>
            prev.map((d) => (d.exercise_id === exerciseId ? fn(d) : d)),
        );

    const handleSave = () => {
        const iso = inputDateToIso(dateInput);
        if (!iso) {
            setDateError('Формат: ГГГГ-ММ-ДД');
            return;
        }
        if (items.length === 0) {
            Alert.alert('Пусто', 'В тренировке должно быть хотя бы одно упражнение');
            return;
        }
        try {
            WorkoutRepo.updateWorkout(workout.id, {
                name: name.trim() || workout.name,
                date: iso,
                comment: comment.trim(),
                exercises: items.map((d) => ({
                    exercise_id: d.exercise_id,
                    sets: d.sets.map((s) => ({
                        reps: s.reps,
                        weight: s.weight,
                    })),
                })),
            });
            bumpWorkouts();
            router.back();
        } catch (e) {
            Alert.alert(
                'Ошибка',
                e instanceof Error ? e.message : 'Не удалось сохранить',
            );
        }
    };

    const handleDelete = () => {
        Alert.alert('Удалить тренировку?', 'Это действие нельзя отменить', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить',
                style: 'destructive',
                onPress: () => {
                    WorkoutRepo.deleteWorkout(workout.id);
                    bumpWorkouts();
                    router.back();
                },
            },
        ]);
    };

    const inputStyle = [
        styles.input,
        {
            color: colors.textPrimary,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Редактирование',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.textPrimary,
                    headerShadowVisible: false,
                    headerRight: () => (
                        <Pressable onPress={handleSave} hitSlop={10}>
                            <Text
                                style={{
                                    color: colors.accent,
                                    fontWeight: '700',
                                    fontSize: 16,
                                }}
                            >
                                Сохранить
                            </Text>
                        </Pressable>
                    ),
                }}
            />
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Название
                </Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={colors.textSecondary}
                    style={inputStyle}
                />

                <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Дата
                </Text>
                <TextInput
                    value={dateInput}
                    onChangeText={(v) => {
                        setDateInput(v);
                        setDateError(null);
                    }}
                    placeholder="ГГГГ-ММ-ДД"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="numbers-and-punctuation"
                    style={[
                        inputStyle,
                        dateError ? { borderColor: colors.danger } : null,
                    ]}
                />
                {dateError && (
                    <Text style={{ color: colors.danger, fontSize: 12 }}>
                        {dateError}
                    </Text>
                )}

                <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Комментарий
                </Text>
                <TextInput
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    placeholderTextColor={colors.textSecondary}
                    style={[inputStyle, styles.multiline]}
                />

                {resolved.map((ex) => (
                    <View
                        key={ex.exercise_id}
                        style={[
                            styles.exCard,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <View style={styles.exHeader}>
                            <View
                                style={[
                                    styles.colorDot,
                                    { backgroundColor: ex.color },
                                ]}
                            />
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.exName,
                                    { color: colors.textPrimary },
                                ]}
                            >
                                {ex.name}
                            </Text>
                            <Pressable
                                hitSlop={12}
                                onPress={() =>
                                    setItems((prev) =>
                                        prev.filter(
                                            (d) =>
                                                d.exercise_id !==
                                                ex.exercise_id,
                                        ),
                                    )
                                }
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={24}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>

                        {ex.sets.map((set, index) => (
                            <View key={set.id} style={styles.setRow}>
                                <Text
                                    style={[
                                        styles.setIndex,
                                        { color: colors.textSecondary },
                                    ]}
                                >
                                    {index + 1}
                                </Text>
                                <NumberStepperField
                                    label="Повторения"
                                    value={set.reps}
                                    colors={colors}
                                    onChange={(reps) =>
                                        patchExercise(ex.exercise_id, (d) => ({
                                            ...d,
                                            sets: d.sets.map((s) =>
                                                s.id === set.id
                                                    ? { ...s, reps }
                                                    : s,
                                            ),
                                        }))
                                    }
                                />
                                {ex.type !== 'bodyweight' && (
                                    <NumberStepperField
                                        label="Вес (кг)"
                                        value={set.weight}
                                        step={2.5}
                                        decimal
                                        colors={colors}
                                        onChange={(weight) =>
                                            patchExercise(
                                                ex.exercise_id,
                                                (d) => ({
                                                    ...d,
                                                    sets: d.sets.map((s) =>
                                                        s.id === set.id
                                                            ? { ...s, weight }
                                                            : s,
                                                    ),
                                                }),
                                            )
                                        }
                                    />
                                )}
                                {ex.sets.length > 1 && (
                                    <Pressable
                                        hitSlop={10}
                                        style={styles.removeSet}
                                        onPress={() =>
                                            patchExercise(
                                                ex.exercise_id,
                                                (d) => ({
                                                    ...d,
                                                    sets: d.sets.filter(
                                                        (s) => s.id !== set.id,
                                                    ),
                                                }),
                                            )
                                        }
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={20}
                                            color={colors.danger}
                                        />
                                    </Pressable>
                                )}
                            </View>
                        ))}

                        <Pressable
                            onPress={() =>
                                patchExercise(ex.exercise_id, (d) => {
                                    const last = d.sets[d.sets.length - 1];
                                    return {
                                        ...d,
                                        sets: [
                                            ...d.sets,
                                            {
                                                id: newSetId(),
                                                reps: last?.reps ?? 10,
                                                weight: last?.weight ?? 0,
                                            },
                                        ],
                                    };
                                })
                            }
                            style={[
                                styles.addBtn,
                                { borderColor: colors.accent },
                            ]}
                        >
                            <Ionicons
                                name="add"
                                size={20}
                                color={colors.accent}
                            />
                            <Text
                                style={{
                                    color: colors.accent,
                                    fontWeight: '600',
                                }}
                            >
                                Добавить подход
                            </Text>
                        </Pressable>
                    </View>
                ))}

                <Pressable
                    onPress={() => setPicking((v) => !v)}
                    style={[styles.addBtn, { borderColor: colors.accent }]}
                >
                    <Ionicons name="add" size={20} color={colors.accent} />
                    <Text style={{ color: colors.accent, fontWeight: '600' }}>
                        Добавить упражнение
                    </Text>
                </Pressable>

                {picking && (
                    <View style={styles.picker}>
                        {available.length === 0 && (
                            <Text style={{ color: colors.textSecondary }}>
                                Все упражнения уже добавлены
                            </Text>
                        )}
                        {available.map((e) => (
                            <Pressable
                                key={e.id}
                                onPress={() => {
                                    setItems((prev) => [
                                        ...prev,
                                        {
                                            exercise_id: e.id,
                                            sets: [
                                                {
                                                    id: newSetId(),
                                                    reps: 10,
                                                    weight: 0,
                                                },
                                            ],
                                        },
                                    ]);
                                    setPicking(false);
                                }}
                                style={[
                                    styles.pickItem,
                                    { backgroundColor: e.color },
                                ]}
                            >
                                <Text
                                    style={{
                                        color: '#151517',
                                        fontWeight: '600',
                                    }}
                                >
                                    {e.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                <Pressable onPress={handleDelete} style={styles.deleteBtn}>
                    <Ionicons
                        name="trash-outline"
                        size={20}
                        color={colors.danger}
                    />
                    <Text style={{ color: colors.danger, fontWeight: '600' }}>
                        Удалить тренировку
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 16, gap: 8, paddingBottom: 48 },
    label: { fontSize: 12, marginTop: 6 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        fontSize: 16,
    },
    multiline: { height: 88, paddingTop: 12, textAlignVertical: 'top' },
    exCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 10,
        marginTop: 10,
    },
    exHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    colorDot: { width: 12, height: 12, borderRadius: 6 },
    exName: { flex: 1, fontSize: 16, fontWeight: '700' },
    setRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    setIndex: {
        width: 20,
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 14,
    },
    removeSet: { paddingBottom: 14, paddingLeft: 2 },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        marginTop: 4,
    },
    picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pickItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        marginTop: 24,
    },
});
