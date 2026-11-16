import type { SetEntry, Workout, DraftExercise } from '@/types/workouts';
import type { WorkoutPreset } from '@/types/presets';
import { emptyDraftState, restoreDraft, serializeDraft, draftFromWorkout, draftFromPreset } from '@/utils/draft';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
export type { EditingWorkout } from '@/utils/draft';

const STORAGE_KEY = 'workout:currentDraft';
const EDITING_KEY = 'workout:editingWorkout';
export const DEFAULT_SET = { reps: 10, weight: 0 };
const createSetId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const createEmptySet = (): SetEntry => ({ id: createSetId(), ...DEFAULT_SET });

export function useWorkoutDraft() {
    const [state, setState] = useState(emptyDraftState);
    const [restoreAttempt, setRestoreAttempt] = useState(0);
    const [hydrated, setHydrated] = useState(false);
    const [storageError, setStorageError] = useState<string | null>(null);
    const writes = useRef(Promise.resolve());
    useEffect(() => {
        let cancelled = false;
        Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(EDITING_KEY)])
            .then(([raw, editing]) => { if (!cancelled) { setState(restoreDraft(raw, editing)); setHydrated(true); setStorageError(null); } })
            .catch(() => { if (!cancelled) setStorageError('Не удалось восстановить черновик. Повторите загрузку, чтобы не потерять сохранённые данные.'); });
        return () => { cancelled = true; };
    }, [restoreAttempt]);
    useEffect(() => {
        if (!hydrated) return;
        // Один снимок и последовательная очередь: состав и происхождение не расходятся.
        const snapshot = serializeDraft(state);
        writes.current = writes.current.then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot))
            .then(() => { setStorageError(null); })
            .catch(() => { setStorageError('Не удалось сохранить черновик на устройстве'); });
    }, [state, hydrated]);
    const changeDraft = useCallback((change: (draft: DraftExercise[]) => DraftExercise[]) => {
        if (!hydrated) return;
        setState((prev) => ({ ...prev, draft: change(prev.draft) }));
    }, [hydrated]);
    const addExercise = useCallback((exerciseId: number) => changeDraft((prev) => prev.some((entry) => entry.exercise_id === exerciseId)
        ? prev : [...prev, { exercise_id: exerciseId, sets: [createEmptySet()] }]), [changeDraft]);
    const removeExercise = useCallback((exerciseId: number) => changeDraft((prev) => prev.filter((entry) => entry.exercise_id !== exerciseId)), [changeDraft]);
    const updateExerciseComment = useCallback((exerciseId: number, comment: string) => changeDraft((prev) => prev.map((entry) => entry.exercise_id === exerciseId
        ? { ...entry, comment } : entry)), [changeDraft]);
    const addSet = useCallback((exerciseId: number) => changeDraft((prev) => prev.map((entry) => entry.exercise_id === exerciseId
        ? { ...entry, sets: [...entry.sets, createEmptySet()] } : entry)), [changeDraft]);
    const updateSet = useCallback((exerciseId: number, setId: string, patch: Partial<Omit<SetEntry, 'id'>>) => changeDraft((prev) => prev.map((entry) => entry.exercise_id === exerciseId
        ? { ...entry, sets: entry.sets.map((set) => set.id === setId ? { ...set, ...patch } : set) } : entry)), [changeDraft]);
    const removeSet = useCallback((exerciseId: number, setId: string) => changeDraft((prev) => prev.map((entry) => entry.exercise_id === exerciseId
        ? { ...entry, sets: entry.sets.filter((set) => set.id !== setId) } : entry)), [changeDraft]);
    const replaceSets = useCallback((exerciseId: number, sets: { reps: number; weight: number }[]) => changeDraft((prev) => prev.map((entry) => entry.exercise_id === exerciseId
        ? { ...entry, sets: sets.map((set) => ({ ...set, id: createSetId() })) } : entry)), [changeDraft]);
    const loadWorkout = useCallback((workout: Workout) => { if (hydrated) setState(draftFromWorkout(workout)); }, [hydrated]);
    const loadPreset = useCallback((preset: WorkoutPreset) => { if (hydrated) setState(draftFromPreset(preset)); }, [hydrated]);
    const reset = useCallback(() => { if (hydrated) setState(emptyDraftState()); }, [hydrated]);
    const retryRestore = () => setRestoreAttempt((attempt) => attempt + 1);
    return { ...state, retryRestore, hydrated, storageError, updateExerciseComment, addExercise, removeExercise, addSet, updateSet, removeSet, replaceSets, loadWorkout, loadPreset, reset };
}
