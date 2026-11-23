import type { DraftExercise, Workout } from '@/types/workouts';
import type { PresetOrigin, WorkoutPreset } from '@/types/presets';

export interface EditingWorkout { id: number; name: string; date: string; comment: string }
export interface DraftState { draft: DraftExercise[]; editing: EditingWorkout | null; origin: PresetOrigin | null }
export const emptyDraftState = (): DraftState => ({ draft: [], editing: null, origin: null });
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object';
function validDraft(value: unknown): value is DraftExercise[] {
    return Array.isArray(value) && value.every((exercise) => isObject(exercise) && Number.isInteger(exercise.exercise_id) &&
        Array.isArray(exercise.sets) && exercise.sets.every((set) => isObject(set) && typeof set.id === 'string' &&
            typeof set.reps === 'number' && Number.isFinite(set.reps) && typeof set.weight === 'number' && Number.isFinite(set.weight)));
}
function validEditing(value: unknown): value is EditingWorkout {
    return isObject(value) && Number.isInteger(value.id) && typeof value.name === 'string' &&
        typeof value.date === 'string' && typeof value.comment === 'string';
}
export function restoreDraft(raw: string | null, legacyEditing: string | null): DraftState {
    if (!raw) return emptyDraftState();
    try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            let editing: unknown = null;
            try { editing = legacyEditing ? JSON.parse(legacyEditing) : null; } catch {}
            return validDraft(parsed) ? { draft: parsed, editing: validEditing(editing) ? editing : null, origin: null } : emptyDraftState();
        }
        if (!isObject(parsed) || parsed.version !== 2 || !validDraft(parsed.draft)) return emptyDraftState();
        const origin = parsed.origin;
        return { draft: parsed.draft, editing: validEditing(parsed.editing) ? parsed.editing : null,
            origin: isObject(origin) && Number.isInteger(origin.preset_id) && typeof origin.preset_name === 'string'
                ? { preset_id: origin.preset_id as number, preset_name: origin.preset_name } : null };
    } catch { return emptyDraftState(); }
}
export const serializeDraft = (state: DraftState) => JSON.stringify({ version: 2, ...state });
export function draftFromPreset(preset: WorkoutPreset, withoutSets = true): DraftState {
    return { draft: [...new Set(preset.exercise_ids)].map((exercise_id) => ({ exercise_id, sets: withoutSets ? [] : (preset.exercises?.find((e) => e.exercise_id === exercise_id)?.sets ?? []).map((set) => ({ ...set, id: `${Date.now()}-${Math.random()}` })) })),
        editing: null, origin: { preset_id: preset.id, preset_name: preset.name } };
}
export function draftFromWorkout(workout: Workout): DraftState {
    return { draft: workout.exercises.map((exercise) => ({ exercise_id: exercise.exercise_id,
        comment: exercise.comment ?? '',
        sets: exercise.sets.map((set) => ({ id: String(set.id), reps: set.reps, weight: set.weight })) })),
        editing: { id: workout.id, name: workout.name, date: workout.date, comment: workout.comment },
        origin: workout.preset_id != null && workout.preset_name != null
            ? { preset_id: workout.preset_id, preset_name: workout.preset_name } : null };
}
export function moveDraftExercise(draft: DraftExercise[], exerciseId: number, targetId: number): DraftExercise[] {
    const from = draft.findIndex((entry) => entry.exercise_id === exerciseId);
    const to = draft.findIndex((entry) => entry.exercise_id === targetId);
    if (from < 0 || to < 0 || from === to) return draft;
    const next = [...draft];
    const [entry] = next.splice(from, 1);
    next.splice(to, 0, entry);
    return next;
}

export function exercisesForSave<T extends DraftExercise>(draft: T[]): T[] {
    const filled = draft.filter((exercise) => exercise.sets.length > 0);
    if (!filled.length) throw new Error('Добавьте хотя бы один подход');
    for (const exercise of filled) {
        if (exercise.sets.some((set) => !Number.isInteger(set.reps) || set.reps < 1 || !Number.isFinite(set.weight) || set.weight < 0)) {
            throw new Error('В каждом подходе должно быть хотя бы одно повторение и неотрицательный вес');
        }
    }
    return filled;
}
