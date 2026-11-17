// src/db/init.ts
import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
    if (!dbInstance) {
        throw new Error(
            'Database not initialized. Call initializeDatabase() first.'
        );
    }
    return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
    if (dbInstance) return;

    dbInstance = await SQLite.openDatabaseAsync('workout.db');

    await dbInstance.execAsync(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS body_weight_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      weight_kg REAL NOT NULL CHECK(weight_kg > 0)
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('weighted', 'assisted', 'bodyweight')),
      description TEXT DEFAULT '',
      color TEXT NOT NULL DEFAULT '#a0d37f',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      weight_unit TEXT NOT NULL DEFAULT 'kg' CHECK(weight_unit IN ('kg', 'lb')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      preset_id INTEGER REFERENCES workout_presets(id),
      preset_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      comment TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS workout_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS workout_preset_exercises (
      preset_id INTEGER NOT NULL REFERENCES workout_presets(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY(preset_id, exercise_id)
    );
    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS preset_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      reps INTEGER NOT NULL CHECK(reps >= 1),
      weight REAL NOT NULL CHECK(weight >= 0),
      sort_order INTEGER NOT NULL,
      FOREIGN KEY(preset_id,exercise_id) REFERENCES workout_preset_exercises(preset_id,exercise_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS workout_sets_exercise_idx ON workout_sets(workout_exercise_id, sort_order);
    CREATE INDEX IF NOT EXISTS workout_exercises_exercise_idx ON workout_exercises(exercise_id, workout_id);
  `);

    const exerciseEntryColumns = await dbInstance.getAllAsync<{ name: string }>('PRAGMA table_info(workout_exercises)');
    if (!exerciseEntryColumns.some((c) => c.name === 'comment')) {
        await dbInstance.execAsync("ALTER TABLE workout_exercises ADD COLUMN comment TEXT NOT NULL DEFAULT ''");
    }
    const workoutColumns = await dbInstance.getAllAsync<{ name: string }>('PRAGMA table_info(workouts)');
    if (!workoutColumns.some((c) => c.name === 'preset_id')) {
        await dbInstance.execAsync('ALTER TABLE workouts ADD COLUMN preset_id INTEGER REFERENCES workout_presets(id)');
    }
    if (!workoutColumns.some((c) => c.name === 'preset_name')) {
        await dbInstance.execAsync('ALTER TABLE workouts ADD COLUMN preset_name TEXT');
    }
    await migrateExercisesColor();
    await migrateWorkoutsComment();
    const columns = await dbInstance.getAllAsync<{ name: string }>('PRAGMA table_info(exercises)');
    if (!columns.some((c) => c.name === 'weight_unit')) {
        await dbInstance.execAsync("ALTER TABLE exercises ADD COLUMN weight_unit TEXT NOT NULL DEFAULT 'kg' CHECK(weight_unit IN ('kg', 'lb'))");
    }
    if (!columns.some((c) => c.name === 'is_favorite')) {
        await dbInstance.execAsync('ALTER TABLE exercises ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0');
    }
}

async function migrateExercisesColor(): Promise<void> {
    const db = dbInstance!;
    const columns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(exercises)'
    );
    if (columns.some((c) => c.name === 'color')) return;

    await db.execAsync(
        `ALTER TABLE exercises ADD COLUMN color TEXT NOT NULL DEFAULT '#a0d37f';`
    );
    await db.execAsync(
        `UPDATE exercises SET color = '#a0d37f' WHERE color IS NULL OR color = '';`
    );
}

async function migrateWorkoutsComment(): Promise<void> {
    const db = dbInstance!;
    const columns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(workouts)'
    );
    if (columns.some((c) => c.name === 'comment')) return;

    await db.execAsync(
        `ALTER TABLE workouts ADD COLUMN comment TEXT NOT NULL DEFAULT '';`
    );
}
