// src/db/exercises.ts
import type {
    CreateExerciseInput,
    Exercise,
    UpdateExerciseInput,
} from '@/types/exercise';
import { getDatabase } from './init';

type ExerciseRow = Omit<Exercise, 'is_favorite'> & { is_favorite: number };
const toExercise = (row: ExerciseRow): Exercise => ({ ...row, is_favorite: row.is_favorite === 1 });

export function getAllExercises(): Exercise[] {
    const db = getDatabase();
    return db.getAllSync<ExerciseRow>(
        'SELECT id, name, type, description, color, is_favorite, weight_unit FROM exercises ORDER BY name',
    ).map(toExercise);
}

export function getExercisesBySearch(query: string): Exercise[] {
    const db = getDatabase();
    const q = `%${query}%`;
    return db.getAllSync<ExerciseRow>(
        'SELECT id, name, type, description, color, is_favorite, weight_unit FROM exercises WHERE name LIKE ? ORDER BY name',
        [q],
    ).map(toExercise);
}

function insertExercise(
    db: ReturnType<typeof getDatabase>,
    input: CreateExerciseInput,
): number {
    const result = db.runSync(
        'INSERT INTO exercises (name, type, description, color, is_favorite, weight_unit) VALUES (?, ?, ?, ?, ?, ?)',
        [input.name, input.type, input.description, input.color, input.is_favorite ? 1 : 0, input.weight_unit ?? 'kg'],
    );
    return result.lastInsertRowId;
}

export function createExercise(input: CreateExerciseInput): number {
    return insertExercise(getDatabase(), input);
}

/** Добавляет все упражнения одной транзакцией; дубли по названию не проверяются */
export function createExercises(inputs: CreateExerciseInput[]): void {
    const db = getDatabase();
    db.withTransactionSync(() => {
        for (const input of inputs) insertExercise(db, input);
    });
}

export function updateExercise(input: UpdateExerciseInput): void {
    const db = getDatabase();
    const existing = db.getFirstSync<ExerciseRow>(
        'SELECT id, name, type, description, color, is_favorite, weight_unit FROM exercises WHERE id = ?',
        [input.id],
    );
    if (!existing) throw new Error(`Exercise ${input.id} not found`);

    db.runSync(
        'UPDATE exercises SET name = ?, type = ?, description = ?, color = ?, is_favorite = ?, weight_unit = ? WHERE id = ?',
        [
            input.name ?? existing.name,
            input.type ?? existing.type,
            input.description ?? existing.description,
            input.color ?? existing.color,
            input.is_favorite === undefined ? existing.is_favorite : Number(input.is_favorite),
            input.weight_unit ?? existing.weight_unit,
            input.id,
        ],
    );
}

export function deleteExercise(id: number): void {
    const db = getDatabase();
    db.runSync('DELETE FROM exercises WHERE id = ?', [id]);
}

export function setExerciseFavorite(id: number, value: boolean): void {
    getDatabase().runSync('UPDATE exercises SET is_favorite = ? WHERE id = ?', [Number(value), id]);
}

export function setExerciseWeightUnit(id: number, unit: Exercise['weight_unit']): void {
    getDatabase().runSync('UPDATE exercises SET weight_unit = ? WHERE id = ?', [unit, id]);
}
