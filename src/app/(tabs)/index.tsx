import { usePresets } from '@/hooks/usePresets';
import { PresetEditor } from '@/components/PresetEditor/PresetEditor';
import { ThemeSheet } from '@/components/ThemeSheet/ThemeSheet';
import { Action } from '@/components/ScreenControls/ScreenControls';
import { exercisesForSave } from '@/utils/draft';
import type { WorkoutPreset } from '@/types/presets';
// src/app/(tabs)/index.tsx
import { ExerciseSquare } from '@/components/ExerciseSquare/ExerciseSquare';
import { FinishFab } from '@/components/FinishFab/FinishFab';
import {
    FinishWorkoutSheet,
    type FinishWorkoutData,
    type FinishWorkoutSheetRef,
} from '@/components/FinishWorkoutSheet/FinishWorkoutSheet';
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import { SetsSheet, type SetsSheetRef } from '@/components/SetsSheet/SetsSheet';
import { WorkoutDropZone } from '@/components/WorkoutDropZone/WorkoutDropZone';
import { useDataVersion } from '@/context/DataVersionContext';
import * as WorkoutRepo from '@/db/workouts';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutDraftContext } from '@/context/WorkoutDraftContext';
import { useTheme } from '@/theme/ThemeContext';
import type { Exercise } from '@/types/exercise';
import { resolveDraft, type ResolvedDraftExercise } from '@/utils/resolveDraft';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
    ScrollView,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function WorkoutScreen() {
    const colors = useTheme();
    const { exercises } = useExercises();
    const { presets, error: presetsError } = usePresets();
    const [presetSheet, setPresetSheet] = useState<'pick' | 'create' | null>(null);
    const [search, setSearch] = useState('');
    const draft = useWorkoutDraftContext();
    const dialog = useDialog();
    const { bumpWorkouts } = useDataVersion();
    const sheetRef = useRef<SetsSheetRef>(null);
    const finishRef = useRef<FinishWorkoutSheetRef>(null);

    const resolvedDraft = useMemo(
        () => resolveDraft(draft.draft, exercises),
        [draft.draft, exercises],
    );

    // Упражнения из текущей тренировки не исключаем: повторное нажатие просто открывает его подходы
    const availableExercises = useMemo(() => {
        const q = search.trim().toLowerCase();
        return exercises.filter(
            (e) => !q || e.name.toLowerCase().includes(q),
        );
    }, [exercises, search]);

    const addAndOpen = useCallback(
        (exerciseId: number) => {
            if (!draft.hydrated) return;
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

    const saveableCount = resolvedDraft.filter((exercise) => exercise.sets.length > 0).length;
    const choosePreset = (preset: WorkoutPreset) => {
        setPresetSheet(null);
        const load = () => draft.loadPreset(preset);
        if (draft.draft.length || draft.editing) dialog.show({ title: 'Заменить текущую тренировку?',
            message: 'Несохранённые изменения будут заменены упражнениями пресета.', buttons: [
                { text: 'Оставить текущую', style: 'cancel' }, { text: 'Заменить', style: 'destructive', onPress: load },
            ] });
        else load();
    };
    const handleFinishPress = useCallback(() => {
        if (!draft.hydrated) return;
        if (saveableCount === 0) {
            dialog.show({
                title: 'Пусто',
                message:
                    'Добавь хотя бы один подход, прежде чем завершить тренировку',
            });
            return;
        }
        finishRef.current?.open();
    }, [draft.hydrated, saveableCount, dialog]);

    const handleFinishConfirm = useCallback(
        (data: FinishWorkoutData) => {
            try {
                const input = {
                    preset_id: draft.origin?.preset_id ?? null,
                    preset_name: draft.origin?.preset_name ?? null,
                    name: data.name,
                    date: data.date,
                    comment: data.comment,
                    exercises: exercisesForSave(resolvedDraft).map((d) => ({
                        exercise_id: d.exercise_id,
                        comment: d.comment ?? '',
                        sets: d.sets.map((s) => ({
                            reps: s.reps,
                            weight: s.weight,
                        })),
                    })),
                };
                if (draft.editing) {
                    WorkoutRepo.updateWorkout(draft.editing.id, input);
                } else {
                    WorkoutRepo.createWorkout(input);
                }
                const wasEditing = draft.editing !== null;
                draft.reset();
                bumpWorkouts();
                dialog.show({
                    title: 'Готово',
                    message: wasEditing
                        ? 'Изменения сохранены в истории'
                        : 'Тренировка сохранена в истории',
                });
                return true;
            } catch (e) {
                dialog.show({
                    title: 'Ошибка',
                    message:
                        e instanceof Error ? e.message : 'Не удалось сохранить',
                });
                return false;
            }
        },
        [draft, resolvedDraft, bumpWorkouts, dialog],
    );

    const handleCancelEdit = useCallback(() => {
        dialog.show({
            title: 'Отменить редактирование?',
            message: 'Внесённые изменения не сохранятся, тренировка в истории останется прежней',
            buttons: [
                { text: 'Продолжить редактирование', style: 'cancel' },
                {
                    text: 'Отменить изменения',
                    style: 'destructive',
                    onPress: draft.reset,
                },
            ],
        });
    }, [dialog, draft.reset]);

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {draft.storageError && <Text style={{ color: colors.danger, marginHorizontal: 16 }}>{draft.storageError}</Text>}
            {!draft.hydrated && draft.storageError && <Action title="Повторить загрузку черновика" onPress={draft.retryRestore} />}
            {presetsError && <Text style={{ color: colors.danger, marginHorizontal: 16 }}>{presetsError}</Text>}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginBottom: 10 }}>
                <Action title="Выбрать пресет" disabled={!draft.hydrated} onPress={() => setPresetSheet('pick')} />
                <Action title="Сохранить как пресет" disabled={!draft.hydrated || !resolvedDraft.length} onPress={() => setPresetSheet('create')} />
            </View>
            {draft.origin && <Text style={{ color: colors.textSecondary, marginHorizontal: 16, marginBottom: 8 }}>Пресет: {draft.origin.preset_name}</Text>}
            {draft.editing && (
                <View
                    style={[
                        styles.editBanner,
                        {
                            backgroundColor: colors.accentMuted,
                            borderColor: colors.accent,
                        },
                    ]}
                >
                    <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.textInverse}
                    />
                    <Text
                        numberOfLines={1}
                        style={[styles.editTitle, { color: colors.textInverse }]}
                    >
                        Редактирование: {draft.editing.name}
                    </Text>
                    <Pressable onPress={handleCancelEdit} hitSlop={10}>
                        <Text
                            style={{
                                color: colors.textInverse,
                                fontWeight: '700',
                            }}
                        >
                            Отменить
                        </Text>
                    </Pressable>
                </View>
            )}
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
                style={styles.squares}
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
                disabled={!draft.hydrated || saveableCount === 0}
            />

            <SetsSheet
                ref={sheetRef}
                excludeWorkoutId={draft.editing?.id}
                colors={colors}
                draft={resolvedDraft}
                onUpdateExerciseComment={draft.updateExerciseComment}
                onReplaceSets={draft.replaceSets}
                onAddSet={draft.addSet}
                onUpdateSet={draft.updateSet}
                onRemoveSet={draft.removeSet}
            />

            {presetSheet && <ThemeSheet onClose={() => setPresetSheet(null)}>
                {presetSheet === 'create' ? <PresetEditor initialIds={resolvedDraft.map((exercise) => exercise.exercise_id)} onSaved={() => setPresetSheet(null)} onCancel={() => setPresetSheet(null)} />
                    : <>
                        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700' }}>Выбрать пресет</Text>
                        {presets.map((preset) => <Action key={preset.id} title={preset.name} disabled={!preset.exercise_ids.length} onPress={() => choosePreset(preset)} />)}
                        {!presets.length && <Text style={{ color: colors.textSecondary }}>Создайте пресет на вкладке «Пресеты»</Text>}
                    </>}
            </ThemeSheet>}
            <FinishWorkoutSheet
                ref={finishRef}
                colors={colors}
                exerciseCount={saveableCount}
                initial={draft.editing}
                onConfirm={handleFinishConfirm}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 12 },
    editBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    editTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
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
    // Без flexGrow: 0 лента растягивается и отнимает место у области тренировки
    squares: { flexGrow: 0 },
    squaresRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
});
