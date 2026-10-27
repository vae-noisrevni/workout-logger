// src/app/(tabs)/index.tsx
import { ExerciseSquare } from '@/components/ExerciseSquare/ExerciseSquare';
import { FinishFab } from '@/components/FinishFab/FinishFab';
import {
    FinishWorkoutSheet,
    type FinishWorkoutData,
    type FinishWorkoutSheetRef,
} from '@/components/FinishWorkoutSheet/FinishWorkoutSheet';
import { SetsSheet, type SetsSheetRef } from '@/components/SetsSheet/SetsSheet';
import { WorkoutDropZone } from '@/components/WorkoutDropZone/WorkoutDropZone';
import { useDataVersion } from '@/context/DataVersionContext';
import * as WorkoutRepo from '@/db/workouts';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutDraft } from '@/hooks/useWorkoutDraft';
import { useTheme } from '@/theme/ThemeContext';
import type { Exercise } from '@/types/exercise';
import { resolveDraft, type ResolvedDraftExercise } from '@/utils/resolveDraft';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

export default function WorkoutScreen() {
    const colors = useTheme();
    const { exercises } = useExercises();
    const [search, setSearch] = useState('');
    const draft = useWorkoutDraft();
    const { bumpWorkouts } = useDataVersion();
    const sheetRef = useRef<SetsSheetRef>(null);
    const finishRef = useRef<FinishWorkoutSheetRef>(null);

    const resolvedDraft = useMemo(
        () => resolveDraft(draft.draft, exercises),
        [draft.draft, exercises],
    );

    // Поиск — только по ещё не добавленным упражнениям; полный список нужен для resolveDraft
    const availableExercises = useMemo(() => {
        const used = new Set(draft.draft.map((d) => d.exercise_id));
        const q = search.trim().toLowerCase();
        return exercises.filter(
            (e) => !used.has(e.id) && (!q || e.name.toLowerCase().includes(q)),
        );
    }, [exercises, draft.draft, search]);

    const addAndOpen = useCallback(
        (exerciseId: number) => {
            draft.addExercise(exerciseId);
            sheetRef.current?.open(exerciseId);
        },
        [draft],
    );

    const handlePress = useCallback(
        (exercise: Exercise) => addAndOpen(exercise.id),
        [addAndOpen],
    );

    const handleCardPress = useCallback((exercise: ResolvedDraftExercise) => {
        sheetRef.current?.open(exercise.exercise_id);
    }, []);

    const handleFinishPress = useCallback(() => {
        if (draft.draft.length === 0) {
            Alert.alert(
                'Пусто',
                'Добавь хотя бы одно упражнение, прежде чем завершить тренировку',
            );
            return;
        }
        finishRef.current?.open();
    }, [draft.draft.length]);

    const handleFinishConfirm = useCallback(
        (data: FinishWorkoutData) => {
            try {
                WorkoutRepo.createWorkout({
                    name: data.name,
                    date: data.date,
                    comment: data.comment,
                    exercises: draft.draft.map((d) => ({
                        exercise_id: d.exercise_id,
                        sets: d.sets.map((s) => ({
                            reps: s.reps,
                            weight: s.weight,
                        })),
                    })),
                });
                draft.reset();
                bumpWorkouts();
                Alert.alert('Готово', 'Тренировка сохранена в истории');
            } catch (e) {
                Alert.alert(
                    'Ошибка',
                    e instanceof Error ? e.message : 'Не удалось сохранить',
                );
            }
        },
        [draft, bumpWorkouts],
    );

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View
                style={[
                    styles.searchRow,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    },
                ]}
            >
                <Ionicons
                    name="search"
                    size={20}
                    color={colors.textSecondary}
                />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Поиск упражнений..."
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                />
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.squaresRow}
            >
                {availableExercises.map((ex) => (
                    <ExerciseSquare
                        key={ex.id}
                        exercise={ex}
                        colors={colors}
                        onPress={handlePress}
                    />
                ))}
            </ScrollView>

            <WorkoutDropZone
                draft={resolvedDraft}
                colors={colors}
                onCardPress={handleCardPress}
                onCardRemove={draft.removeExercise}
            />

            <FinishFab
                colors={colors}
                onPress={handleFinishPress}
                disabled={draft.draft.length === 0}
            />

            <SetsSheet
                ref={sheetRef}
                colors={colors}
                draft={resolvedDraft}
                onAddSet={draft.addSet}
                onUpdateSet={draft.updateSet}
                onRemoveSet={draft.removeSet}
            />

            <FinishWorkoutSheet
                ref={finishRef}
                colors={colors}
                exerciseCount={draft.draft.length}
                onConfirm={handleFinishConfirm}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 12 },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
    squaresRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
});
