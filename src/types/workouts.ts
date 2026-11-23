// src/types/workout.ts
import type { ExerciseType } from './exercise';

// ─── Draft (в памяти, ещё не сохранено) ────────────────────────────
export interface SetEntry {
    id: string; // локальный id для React key и поиска
    reps: number;
    weight: number;
}

export interface DraftExercise {
    comment?: string;
    exercise_id: number;
    sets: SetEntry[];
}

// ─── Сохранённая тренировка (из БД) ────────────────────────────────
export interface WorkoutSet {
    id: number; // id из таблицы workout_sets
    reps: number;
    weight: number;
}

export interface WorkoutExercise {
    comment: string;
    id: number; // id из таблицы workout_exercises
    workout_id: number;
    exercise_id: number;
    name: string;
    type: ExerciseType;
    color: string;
    sort_order: number;
    sets: WorkoutSet[];
}

export interface Workout {
    preset_id: number | null;
    preset_name: string | null;
    id: number;
    name: string;
    date: string; // ISO
    comment: string;
    exercises: WorkoutExercise[];
}

// ─── Вход для создания ─────────────────────────────────────────────
export interface CreateWorkoutInput {
    preset_id?: number | null;
    preset_name?: string | null;
    name: string;
    date: string; // ISO
    comment: string;
    exercises: {
        exercise_id: number;
        comment?: string;
        sets: { reps: number; weight: number }[];
    }[];
}

// ─── Распарсенная тренировка из файла импорта ──────────────────────
// Упражнения заданы названием: id в файле нет, сопоставление идёт со справочником
export interface ImportedWorkout {
    name: string;
    date: string; // ISO
    comment: string;
    exercises: {
        name: string;
        comment: string;
        sets: { reps: number; weight: number }[];
    }[];
}
