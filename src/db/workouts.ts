// src/db/workouts.ts
import type { ExerciseType } from '@/types/exercise';
import { isoToInputDate } from '@/utils/date';
import { ImportError } from '@/utils/importError';
import type {
    CreateWorkoutInput,
    ImportedWorkout,
    Workout,
    WorkoutExercise,
    WorkoutSet,
} from '@/types/workouts.ts';
import { getDatabase } from './init';

interface WorkoutRow {
    id: number;
    name: string;
    date: string;
    comment: string;
}

interface WorkoutExerciseRow {
    id: number;
    workout_id: number;
    exercise_id: number;
    name: string;
    type: ExerciseType;
    color: string;
    sort_order: number;
}

interface WorkoutSetRow {
    id: number;
    workout_exercise_id: number;
    reps: number;
    weight: number;
    sort_order: number;
}

// ─── Чтение ────────────────────────────────────────────────────────

export function getAllWorkouts(): Workout[] {
    const db = getDatabase();
    const workouts = db.getAllSync<WorkoutRow>(
        'SELECT id, name, date, comment FROM workouts ORDER BY date DESC'
    );
    return workouts.map((w) => ({
        ...w,
        exercises: getWorkoutExercises(w.id),
    }));
}

export function getWorkoutById(id: number): Workout | null {
    const db = getDatabase();
    const w = db.getFirstSync<WorkoutRow>(
        'SELECT id, name, date, comment FROM workouts WHERE id = ?',
        [id]
    );
    if (!w) return null;
    return { ...w, exercises: getWorkoutExercises(w.id) };
}

function getWorkoutExercises(workoutId: number): WorkoutExercise[] {
    const db = getDatabase();
    const rows = db.getAllSync<WorkoutExerciseRow>(
        `SELECT
            we.id,
            we.workout_id,
            we.exercise_id,
            e.name,
            e.type,
            e.color,
            we.sort_order
         FROM workout_exercises we
         JOIN exercises e ON e.id = we.exercise_id
         WHERE we.workout_id = ?
         ORDER BY we.sort_order ASC`,
        [workoutId]
    );

    return rows.map((row) => ({
        ...row,
        sets: getWorkoutSets(row.id),
    }));
}

function getWorkoutSets(workoutExerciseId: number): WorkoutSet[] {
    const db = getDatabase();
    return db.getAllSync<WorkoutSetRow>(
        `SELECT id, workout_exercise_id, reps, weight, sort_order
         FROM workout_sets
         WHERE workout_exercise_id = ?
         ORDER BY sort_order ASC`,
        [workoutExerciseId]
    );
}

// ─── Запись ────────────────────────────────────────────────────────

function insertExercises(
    db: ReturnType<typeof getDatabase>,
    workoutId: number,
    exercises: CreateWorkoutInput['exercises']
): void {
    exercises.forEach((ex, exIndex) => {
        const weResult = db.runSync(
            `INSERT INTO workout_exercises
                (workout_id, exercise_id, sort_order)
             VALUES (?, ?, ?)`,
            [workoutId, ex.exercise_id, exIndex]
        );
        const workoutExerciseId = weResult.lastInsertRowId;

        ex.sets.forEach((set, setIndex) => {
            db.runSync(
                `INSERT INTO workout_sets
                    (workout_exercise_id, reps, weight, sort_order)
                 VALUES (?, ?, ?, ?)`,
                [workoutExerciseId, set.reps, set.weight, setIndex]
            );
        });
    });
}

// Без собственной транзакции: вложенные транзакции в SQLite не поддерживаются, importWorkouts вызывает её внутри своей
function insertWorkout(
    db: ReturnType<typeof getDatabase>,
    input: CreateWorkoutInput
): number {
    const result = db.runSync(
        'INSERT INTO workouts (name, date, comment) VALUES (?, ?, ?)',
        [input.name, input.date, input.comment]
    );
    insertExercises(db, result.lastInsertRowId, input.exercises);
    return result.lastInsertRowId;
}

export function createWorkout(input: CreateWorkoutInput): number {
    const db = getDatabase();
    let workoutId = 0;
    db.withTransactionSync(() => {
        workoutId = insertWorkout(db, input);
    });
    return workoutId;
}

/** Обновляет тренировку целиком: упражнения и подходы пересоздаются (ON DELETE CASCADE) */
export function updateWorkout(id: number, input: CreateWorkoutInput): void {
    const db = getDatabase();

    db.withTransactionSync(() => {
        db.runSync(
            'UPDATE workouts SET name = ?, date = ?, comment = ? WHERE id = ?',
            [input.name, input.date, input.comment, id]
        );
        db.runSync('DELETE FROM workout_exercises WHERE workout_id = ?', [id]);
        insertExercises(db, id, input.exercises);
    });
}

export function deleteWorkout(id: number): void {
    const db = getDatabase();
    db.runSync('DELETE FROM workouts WHERE id = ?', [id]);
}

export interface ImportResult {
    added: number;
    skipped: number;
}

const workoutKey = (date: string, name: string): string =>
    `${isoToInputDate(date)}|${name.trim().toLowerCase()}`;

/**
 * Импорт тренировок. Упражнения ищутся в справочнике по названию (без учёта регистра);
 * если хоть одного нет — ничего не пишем. Тренировки, у которых совпали день и название
 * с уже имеющимися в истории, пропускаются.
 */
export function importWorkouts(items: ImportedWorkout[]): ImportResult {
    const db = getDatabase();

    const idByName = new Map<string, number>();
    for (const e of db.getAllSync<{ id: number; name: string }>(
        'SELECT id, name FROM exercises ORDER BY id DESC'
    )) {
        idByName.set(e.name.trim().toLowerCase(), e.id);
    }

    const unknown = new Set<string>();
    for (const w of items) {
        for (const ex of w.exercises) {
            if (!idByName.has(ex.name.toLowerCase())) unknown.add(ex.name);
        }
    }
    if (unknown.size > 0) {
        throw new ImportError(
            `В справочнике нет упражнений: ${[...unknown].join(', ')}. ` +
                'Сначала импортируй или создай их.'
        );
    }

    const existing = new Set(
        db
            .getAllSync<{ name: string; date: string }>(
                'SELECT name, date FROM workouts'
            )
            .map((w) => workoutKey(w.date, w.name))
    );

    let added = 0;
    let skipped = 0;
    db.withTransactionSync(() => {
        for (const w of items) {
            if (existing.has(workoutKey(w.date, w.name))) {
                skipped++;
                continue;
            }
            insertWorkout(db, {
                name: w.name,
                date: w.date,
                comment: w.comment,
                exercises: w.exercises.map((ex) => ({
                    exercise_id: idByName.get(ex.name.toLowerCase())!,
                    sets: ex.sets,
                })),
            });
            added++;
        }
    });
    return { added, skipped };
}
