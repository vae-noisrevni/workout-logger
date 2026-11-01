// src/db/exercises.ts
import type {
    CreateExerciseInput,
    Exercise,
    UpdateExerciseInput,
} from '@/types/exercise';
import { getDatabase } from './init';

interface ExerciseRow extends Omit<Exercise, 'favorite'> {
    favorite: number;
}

const COLUMNS = 'id, name, type, description, color, favorite';
// Избранные наверху, внутри групп — по алфавиту
const ORDER = 'ORDER BY favorite DESC, name COLLATE NOCASE';

const toExercise = (row: ExerciseRow): Exercise => ({
    ...row,
    favorite: row.favorite === 1,
});

export function getAllExercises(): Exercise[] {
    const db = getDatabase();
    return db
        .getAllSync<ExerciseRow>(`SELECT ${COLUMNS} FROM exercises ${ORDER}`)
        .map(toExercise);
}

export function getExercisesBySearch(query: string): Exercise[] {
    const db = getDatabase();
    const q = `%${query}%`;
    return db
        .getAllSync<ExerciseRow>(
            `SELECT ${COLUMNS} FROM exercises WHERE name LIKE ? ${ORDER}`,
            [q],
        )
        .map(toExercise);
}

function insertExercise(
    db: ReturnType<typeof getDatabase>,
    input: CreateExerciseInput,
): number {
    const result = db.runSync(
        'INSERT INTO exercises (name, type, description, color, favorite) VALUES (?, ?, ?, ?, ?)',
        [
            input.name,
            input.type,
            input.description,
            input.color,
            input.favorite ? 1 : 0,
        ],
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
    const row = db.getFirstSync<ExerciseRow>(
        `SELECT ${COLUMNS} FROM exercises WHERE id = ?`,
        [input.id],
    );
    const existing = row ? toExercise(row) : null;
    if (!existing) throw new Error(`Exercise ${input.id} not found`);

    db.runSync(
        'UPDATE exercises SET name = ?, type = ?, description = ?, color = ?, favorite = ? WHERE id = ?',
        [
            input.name ?? existing.name,
            input.type ?? existing.type,
            input.description ?? existing.description,
            input.color ?? existing.color,
            (input.favorite ?? existing.favorite) ? 1 : 0,
            input.id,
        ],
    );
}

export function deleteExercise(id: number): void {
    const db = getDatabase();
    db.runSync('DELETE FROM exercises WHERE id = ?', [id]);
}
