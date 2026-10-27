// src/hooks/useWorkoutDraft.ts
import type { DraftExercise, SetEntry } from '@/types/workouts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'workout:currentDraft';

const createSetId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptySet = (): SetEntry => ({
    id: createSetId(),
    reps: 10,
    weight: 0,
});

export function useWorkoutDraft() {
    const [draft, setDraft] = useState<DraftExercise[]>([]);
    // Пока черновик не восстановлен, сохранять нельзя — иначе затрём его пустым []
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        let cancelled = false;
        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (cancelled || !raw) return;
                const parsed = JSON.parse(raw) as DraftExercise[];
                if (Array.isArray(parsed)) setDraft(parsed);
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

    const addSet = useCallback((exerciseId: number) => {
        setDraft((prev) =>
            prev.map((d) =>
                d.exercise_id === exerciseId
                    ? { ...d, sets: [...d.sets, createEmptySet()] }
                    : d
            )
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

    const reset = useCallback(() => setDraft([]), []);

    return {
        draft,
        hydrated,
        addExercise,
        removeExercise,
        addSet,
        updateSet,
        removeSet,
        reset,
    };
}
