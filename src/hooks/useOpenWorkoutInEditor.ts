// src/hooks/useOpenWorkoutInEditor.ts
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import { useWorkoutDraftContext } from '@/context/WorkoutDraftContext';
import type { Workout } from '@/types/workouts';
import { router } from 'expo-router';
import { useCallback } from 'react';

/**
 * Загружает тренировку из истории на экран тренировки в режиме редактирования.
 * Если там уже есть несохранённая работа — сначала спрашивает подтверждение.
 */
export function useOpenWorkoutInEditor(): (workout: Workout) => void {
    const draft = useWorkoutDraftContext();
    const dialog = useDialog();

    const open = useCallback(
        (workout: Workout) => {
            draft.loadWorkout(workout);
            // navigate разворачивает стек до табов, а не пушит новый экран
            router.navigate('/');
        },
        [draft],
    );

    return useCallback(
        (workout: Workout) => {
            const hasCurrent = draft.draft.length > 0 || draft.editing !== null;
            // Повторно открыть ту же тренировку, что уже редактируется, — без вопросов и без потери правок
            if (draft.editing?.id === workout.id) {
                router.navigate('/');
                return;
            }
            if (!hasCurrent) {
                open(workout);
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
                        onPress: () => open(workout),
                    },
                ],
            });
        },
        [draft.draft.length, draft.editing, dialog, open],
    );
}
