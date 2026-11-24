import { resolveDate } from './date';
import type { ExerciseType } from '@/types/exercise';

export interface SetLike { reps: number; weight: number }
export interface StatSetRow extends SetLike { workout_id: number; date: string; exercise_id: number }
export interface MonthCount { month: string; count: number }
export const displayNumber = (value: number) => String(Math.round(value * 100) / 100);
export const setValue = (type: ExerciseType, set: SetLike) => set.weight;
export const isBetter = (type: ExerciseType, a: number, b: number) => type === 'assisted' ? a < b : a > b;
export const valueUnit = (type: ExerciseType) => 'кг';

export function bestSet(type: ExerciseType, sets: SetLike[]): SetLike | null {
    return sets.reduce<SetLike | null>((best, set) => {
        if (!best || isBetter(type, setValue(type, set), setValue(type, best)) ||
            (setValue(type, set) === setValue(type, best) && set.reps > best.reps)) return set;
        return best;
    }, null);
}
export type ExerciseMetric = 'weight' | 'reps';

export function bestSetForMetric(type: ExerciseType, sets: SetLike[], metric: ExerciseMetric): SetLike | null {
    if (metric === 'weight') return bestSet(type, sets);

    return sets.reduce<SetLike | null>((best, set) => {
        if (!best || set.reps > best.reps || (set.reps === best.reps && isBetter(type, set.weight, best.weight))) return set;
        return best;
    }, null);
}

export function bestValue(type: ExerciseType, sets: SetLike[]): number | null {
    const best = bestSet(type, sets);
    return best ? setValue(type, best) : null;
}
export function monthKey(iso: string): string {
    const date = resolveDate(iso);
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
export function exerciseProgress(type: ExerciseType, rows: StatSetRow[]) {
    const grouped = new Map<string, SetLike[]>();
    for (const row of rows) {
        const key = monthKey(row.date);
        if (!key) continue;
        const group = grouped.get(key) ?? [];
        group.push(row);
        grouped.set(key, group);
    }
    const values = [...grouped].sort(([a], [b]) => a.localeCompare(b))
        .map(([month, sets]) => { const set = bestSet(type, sets)!; return { month, value: setValue(type, set), reps: set.reps }; });
    const latest = values.at(-1) ?? null;
    const previous = values.at(-2) ?? null;
    const diff = latest && previous ? latest.value - previous.value : null;
    const repsDiff = type === 'bodyweight' && latest && previous && diff === 0 ? latest.reps - previous.reps : null;
    return { best: bestValue(type, rows), bestApproach: bestSet(type, rows), repsDiff, latest, previous, diff,
        improved: diff === null ? null : diff === 0 ? (repsDiff ? repsDiff > 0 : null) : isBetter(type, latest!.value, previous!.value) };
}
export function workoutsPerMonth(dates: string[], now: Date, months = 12): MonthCount[] {
    const counts = new Map<string, number>();
    for (const date of dates) {
        const key = monthKey(date);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from({ length: months }, (_, index) => {
        const month = monthKey(new Date(now.getFullYear(), now.getMonth() - months + index + 1, 1).toISOString());
        return { month, count: counts.get(month) ?? 0 };
    });
}
export function exerciseVolume(type: ExerciseType, sets: SetLike[]): number {
    return sets.reduce((sum, set) => sum + (type === 'weighted' ? set.weight * set.reps : set.reps), 0);
}
export const activityColor = (count: number) => count >= 8 ? '#2e7d32' : count >= 5 ? '#ef6c00' : '#c62828';

export const additionalVolume = (sets: SetLike[]) => sets.reduce((sum,set) => sum + set.weight * set.reps, 0);
