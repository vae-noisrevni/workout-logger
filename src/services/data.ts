import { exerciseDb, workoutDb, presetDb, bodyWeightDb } from '@/db/domain';
import type { CreateExerciseInput, UpdateExerciseInput } from '@/types/exercise';
import type { CreateWorkoutInput, ImportedWorkout } from '@/types/workouts';
import type { WorkoutPreset } from '@/types/presets';

// Сервис — граница сценария; SQL и соединение остаются в объекте доступа к БД.
export const exerciseService = {
    list: () => exerciseDb.list(),
    create: (input: CreateExerciseInput) => exerciseDb.create(input),
    update: (input: UpdateExerciseInput) => exerciseDb.update(input),
    remove: (id: number) => exerciseDb.remove(id),
    import: (items: CreateExerciseInput[]) => exerciseDb.import(items),
};
export const workoutService = {
    list: () => workoutDb.list(),
    save: (input: { input: CreateWorkoutInput; id?: number }) => workoutDb.save(input),
    remove: (id: number) => workoutDb.remove(id),
    import: (items: ImportedWorkout[]) => workoutDb.import(items),
};
export const presetService = {
    list: () => presetDb.list(),
    save: (input: Pick<WorkoutPreset, 'name' | 'exercises'> & { id?: number }) => presetDb.save(input),
    remove: (id: number) => presetDb.remove(id),
};
export const bodyWeightService = {
    list: () => bodyWeightDb.list(),
    save: (input: { date: string; weight: number; id?: number }) => bodyWeightDb.save(input),
    remove: (id: number) => bodyWeightDb.remove(id),
};
