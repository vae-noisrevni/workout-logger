import { useMemo } from 'react';
import { useDataVersion } from '@/context/DataVersionContext';
import { getAllExercises } from '@/db/exercises';
import { getSetsForExercises, getAllWorkoutDates } from '@/db/stats';
import { exerciseProgress, workoutsPerMonth } from '@/utils/stats';
import { useLocalDate } from './useLocalDate';

export function useStats() {
    const { exercisesRevision, workoutsRevision } = useDataVersion();
    const date = useLocalDate();
    return useMemo(() => {
        // Ревизии отражают изменения SQLite, не только React-состояния.
        void exercisesRevision; void workoutsRevision;
        try {
            const exercises = getAllExercises().filter((exercise) => exercise.is_favorite);
            const rows = getSetsForExercises(exercises.map((exercise) => exercise.id));
            return { favorites: exercises.map((exercise) => ({ exercise,
                progress: exerciseProgress(exercise.type, rows.filter((row) => row.exercise_id === exercise.id)),
            })), monthly: workoutsPerMonth(getAllWorkoutDates(), new Date(`${date}T12:00:00`)), error: null };
        } catch (error) {
            return { favorites: [], monthly: [], error: error instanceof Error ? error.message : 'Не удалось загрузить статистику' };
        }
    }, [exercisesRevision, workoutsRevision, date]);
}
