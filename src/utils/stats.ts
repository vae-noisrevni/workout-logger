// src/utils/stats.ts — расчёты для таба «Статистика» (без обращения к БД)
import type { Exercise, ExerciseType } from '@/types/exercise';
import type { Workout } from '@/types/workouts';

export interface MonthRef {
    year: number;
    month: number; // 0–11
}

export function monthOf(date: Date): MonthRef {
    return { year: date.getFullYear(), month: date.getMonth() };
}

export function previousMonth({ year, month }: MonthRef): MonthRef {
    return month === 0
        ? { year: year - 1, month: 11 }
        : { year, month: month - 1 };
}

// Дата хранится в ISO (UTC); месяц считаем по часовому поясу устройства, как и в остальном UI
function isInMonth(iso: string, ref: MonthRef): boolean {
    const d = new Date(iso);
    return d.getFullYear() === ref.year && d.getMonth() === ref.month;
}

export function countWorkoutsInMonth(
    workouts: Workout[],
    ref: MonthRef,
): number {
    return workouts.filter((w) => isInMonth(w.date, ref)).length;
}

/** Что считается результатом: для весовых — вес, для остальных — повторы */
export type StatMetric = 'weight' | 'reps';

export function metricFor(type: ExerciseType): StatMetric {
    return type === 'weighted' ? 'weight' : 'reps';
}

export interface BestSet {
    value: number; // вес или повторы — по metric
    reps: number;
    weight: number;
    date: string; // ISO тренировки
}

// Для веса при равенстве лучше больше повторов; для повторов при равенстве — меньше помощи/веса не важен
function isBetter(
    metric: StatMetric,
    candidate: BestSet,
    current: BestSet | null,
): boolean {
    if (!current) return true;
    if (candidate.value !== current.value)
        return candidate.value > current.value;
    if (metric === 'weight') return candidate.reps > current.reps;
    return false;
}

function bestSet(
    workouts: Workout[],
    exerciseId: number,
    metric: StatMetric,
    filter?: (w: Workout) => boolean,
): BestSet | null {
    let best: BestSet | null = null;
    for (const w of workouts) {
        if (filter && !filter(w)) continue;
        for (const ex of w.exercises) {
            if (ex.exercise_id !== exerciseId) continue;
            for (const s of ex.sets) {
                const candidate: BestSet = {
                    value: metric === 'weight' ? s.weight : s.reps,
                    reps: s.reps,
                    weight: s.weight,
                    date: w.date,
                };
                if (isBetter(metric, candidate, best)) best = candidate;
            }
        }
    }
    return best;
}

export interface FavoriteStat {
    exercise: Exercise;
    metric: StatMetric;
    allTime: BestSet | null;
    thisMonth: BestSet | null;
    lastMonth: BestSet | null;
    /** thisMonth − lastMonth; null, если в одном из месяцев упражнения не было */
    delta: number | null;
}

export function favoriteStats(
    workouts: Workout[],
    favorites: Exercise[],
    current: MonthRef,
): FavoriteStat[] {
    const prev = previousMonth(current);
    return favorites.map((exercise) => {
        const metric = metricFor(exercise.type);
        const thisMonth = bestSet(workouts, exercise.id, metric, (w) =>
            isInMonth(w.date, current),
        );
        const lastMonth = bestSet(workouts, exercise.id, metric, (w) =>
            isInMonth(w.date, prev),
        );
        return {
            exercise,
            metric,
            allTime: bestSet(workouts, exercise.id, metric),
            thisMonth,
            lastMonth,
            delta:
                thisMonth && lastMonth
                    ? round1(thisMonth.value - lastMonth.value)
                    : null,
        };
    });
}

// Веса бывают дробными (2.5 кг шаг) — убираем хвосты вида 0.30000000000000004
const round1 = (n: number): number => Math.round(n * 10) / 10;
