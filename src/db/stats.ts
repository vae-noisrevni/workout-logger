import { getDatabase } from './init';
import type { SetLike, StatSetRow } from '@/utils/stats';

export function getSetsForExercises(ids: number[]): StatSetRow[] {
    if (!ids.length) return [];
    return getDatabase().getAllSync<StatSetRow>(`
        SELECT w.id AS workout_id, w.date, we.exercise_id, ws.reps, ws.weight
        FROM workout_sets ws JOIN workout_exercises we ON we.id = ws.workout_exercise_id
        JOIN workouts w ON w.id = we.workout_id
        WHERE we.exercise_id IN (${ids.map(() => '?').join(',')})
        ORDER BY w.date DESC, w.id DESC, ws.sort_order ASC`, ids);
}
export function getAllWorkoutDates(): string[] {
    return getDatabase().getAllSync<{ date: string }>('SELECT date FROM workouts').map((row) => row.date);
}
export function getLastWorkout(exerciseId: number, excludeWorkoutId = -1) {
    const db = getDatabase();
    const row = db.getFirstSync<{ id: number; date: string }>(`
        SELECT we.id, w.date FROM workout_exercises we JOIN workouts w ON w.id = we.workout_id
        WHERE we.exercise_id = ? AND w.id != ? AND EXISTS (
            SELECT 1 FROM workout_sets ws WHERE ws.workout_exercise_id = we.id)
        ORDER BY w.date DESC, w.id DESC LIMIT 1`, [exerciseId, excludeWorkoutId]);
    if (!row) return null;
    return { date: row.date, sets: db.getAllSync<SetLike>(
        'SELECT reps, weight FROM workout_sets WHERE workout_exercise_id = ? ORDER BY sort_order', [row.id]) };
}
export function getLastWorkoutSets(exerciseId: number, excludeWorkoutId?: number): SetLike[] {
    return getLastWorkout(exerciseId, excludeWorkoutId)?.sets ?? [];
}
