import type { ExerciseType } from '@/types/exercise';
import type { SetLike } from './stats';
export type Goal = 'strength' | 'hypertrophy' | 'endurance';
export const GOALS = {
    strength: { label: 'Сила', sets: 4, reps: 5 },
    hypertrophy: { label: 'Масса', sets: 3, reps: 10 },
    endurance: { label: 'Выносливость', sets: 3, reps: 15 },
};
export const WEIGHT_STEP = 2.5;
export const RIR = 2;
const BODYWEIGHT_FACTOR = { strength: 0.5, hypertrophy: 0.7, endurance: 0.85 };
const ASSISTANCE_CHANGE = { strength: -5, hypertrophy: 0, endurance: 5 };
export interface Plan { sets: number; reps: number; weight: number }
export const epley1RM = (weight: number, reps: number) => reps === 1 ? weight : weight * (1 + reps / 30);
export const roundDownToStep = (value: number, step = WEIGHT_STEP) => Math.max(0, Math.floor(value / step) * step);
export function pickWorkingSet(type: ExerciseType, sets: SetLike[]): SetLike | null {
    return sets.reduce<SetLike | null>((best, set) => {
        if (!best) return set;
        if (type === 'bodyweight') return set.reps > best.reps ? set : best;
        if (type === 'assisted') return set.weight < best.weight || (set.weight === best.weight && set.reps > best.reps) ? set : best;
        const score = epley1RM(set.weight, set.reps);
        const bestScore = epley1RM(best.weight, best.reps);
        return score > bestScore || (score === bestScore && set.weight > best.weight) ? set : best;
    }, null);
}
export function calculatePlan(type: ExerciseType, working: SetLike, goal: Goal): Plan | null {
    if (!Number.isFinite(working.reps) || !Number.isFinite(working.weight) || working.reps < 1 || working.weight < 0) return null;
    const target = GOALS[goal];
    if (type === 'bodyweight') return { sets: target.sets, reps: Math.max(1, Math.round(working.reps * BODYWEIGHT_FACTOR[goal])), weight: 0 };
    if (type === 'assisted') return { ...target, weight: roundDownToStep(working.weight + ASSISTANCE_CHANGE[goal]) };
    if (working.weight <= 0) return null;
    const weight = roundDownToStep(epley1RM(working.weight, working.reps) / (1 + (target.reps + RIR) / 30));
    return weight > 0 ? { sets: target.sets, reps: target.reps, weight } : null;
}
export const planToSets = (plan: Plan): SetLike[] => Array.from({ length: plan.sets }, () => ({ reps: plan.reps, weight: plan.weight }));
