import type { Workout } from '@/types/workouts';

export function searchWorkoutHistory(workouts: Workout[], search: string) {
    const query = search.trim().toLowerCase();
    return workouts.flatMap((workout) => {
        const matchingNames = query
            ? [...new Set(workout.exercises
                .filter((exercise) => exercise.name.toLowerCase().includes(query))
                .map((exercise) => exercise.name))]
            : [];
        return !query || matchingNames.length > 0
            ? [{ workout, matchingNames }]
            : [];
    });
}
