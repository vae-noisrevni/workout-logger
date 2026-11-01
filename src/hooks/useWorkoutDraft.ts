// src/hooks/useWorkoutDraft.ts
import type { DraftExercise, SetEntry, Workout } from '@/types/workouts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'workout:currentDraft';
const EDITING_KEY = 'workout:editingWorkout';

/** Тренировка из истории, которая сейчас редактируется на экране тренировки */
export interface EditingWorkout {
    id: number;
    name: string;
    date: string; // ISO
    comment: string;
}

const createSetId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptySet = (): SetEntry => ({
    id: createSetId(),
    reps: 10,
    weight: 0,
});

export function useWorkoutDraft() {
    const [draft, setDraft] = useState<DraftExercise[]>([]);
    const [editing, setEditing] = useState<EditingWorkout | null>(null);
    // Пока черновик не восстановлен, сохранять нельзя — иначе затрём его пустым []
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(EDITING_KEY),
        ])
            .then(([raw, rawEditing]) => {
                if (cancelled) return;
                if (raw) {
                    const parsed = JSON.parse(raw) as DraftExercise[];
                    if (Array.isArray(parsed)) setDraft(parsed);
                }
                if (rawEditing) {
                    setEditing(JSON.parse(rawEditing) as EditingWorkout);
                }
            })
            .catch(() => {
                // Битый/недоступный черновик — начинаем с пустого
            })
            .finally(() => {
                if (!cancelled) setHydrated(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Автосохранение при каждом изменении — переживает сворачивание и выход из приложения
    useEffect(() => {
        if (!hydrated) return;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft)).catch(
            () => {},
        );
    }, [draft, hydrated]);

    useEffect(() => {
        if (!hydrated) return;
        const write = editing
            ? AsyncStorage.setItem(EDITING_KEY, JSON.stringify(editing))
            : AsyncStorage.removeItem(EDITING_KEY);
        write.catch(() => {});
    }, [editing, hydrated]);

    const addExercise = useCallback((exerciseId: number) => {
        setDraft((prev) => {
            if (prev.some((d) => d.exercise_id === exerciseId)) return prev;
            return [
                ...prev,
                { exercise_id: exerciseId, sets: [createEmptySet()] },
            ];
        });
    }, []);

    const removeExercise = useCallback((exerciseId: number) => {
        setDraft((prev) => prev.filter((d) => d.exercise_id !== exerciseId));
    }, []);

    // Новый подход — копия последнего: обычно следующий подход делают с тем же весом
    const addSet = useCallback((exerciseId: number) => {
        setDraft((prev) =>
            prev.map((d) => {
                if (d.exercise_id !== exerciseId) return d;
                const last = d.sets[d.sets.length - 1];
                const next: SetEntry = last
                    ? { id: createSetId(), reps: last.reps, weight: last.weight }
                    : createEmptySet();
                return { ...d, sets: [...d.sets, next] };
            })
        );
    }, []);

    const updateSet = useCallback(
        (
            exerciseId: number,
            setId: string,
            patch: Partial<Omit<SetEntry, 'id'>>
        ) => {
            setDraft((prev) =>
                prev.map((d) =>
                    d.exercise_id === exerciseId
                        ? {
                              ...d,
                              sets: d.sets.map((s) =>
                                  s.id === setId ? { ...s, ...patch } : s
                              ),
                          }
                        : d
                )
            );
        },
        []
    );

    const removeSet = useCallback((exerciseId: number, setId: string) => {
        setDraft((prev) =>
            prev.map((d) =>
                d.exercise_id === exerciseId
                    ? { ...d, sets: d.sets.filter((s) => s.id !== setId) }
                    : d
            )
        );
    }, []);

    // Заменяет текущий черновик тренировкой из истории и включает режим редактирования
    const loadWorkout = useCallback((workout: Workout) => {
        setDraft(
            workout.exercises.map((ex) => ({
                exercise_id: ex.exercise_id,
                comment: ex.comment,
                sets: ex.sets.map((s) => ({
                    id: String(s.id),
                    reps: s.reps,
                    weight: s.weight,
                })),
            })),
        );
        setEditing({
            id: workout.id,
            name: workout.name,
            date: workout.date,
            comment: workout.comment,
        });
    }, []);

    const reset = useCallback(() => {
        setDraft([]);
        setEditing(null);
    }, []);

    return {
        draft,
        hydrated,
        editing,
        loadWorkout,
        addExercise,
        removeExercise,
        addSet,
        updateSet,
        removeSet,
        reset,
    };
}
