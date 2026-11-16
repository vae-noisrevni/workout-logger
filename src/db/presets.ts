import { getDatabase } from './init';
import type { WorkoutPreset } from '@/types/presets';

export function getPresets(): WorkoutPreset[] {
    const db = getDatabase();
    const presets = db.getAllSync<{ id: number; name: string }>('SELECT id, name FROM workout_presets WHERE archived = 0 ORDER BY id');
    const links = db.getAllSync<{ preset_id: number; exercise_id: number }>(
        'SELECT preset_id, exercise_id FROM workout_preset_exercises ORDER BY sort_order');
    return presets.map((preset) => ({ ...preset, exercise_ids: links.filter((link) => link.preset_id === preset.id).map((link) => link.exercise_id) }));
}
export function savePreset(name: string, exerciseIds: number[], id?: number): void {
    const ids = [...new Set(exerciseIds)];
    if (!name.trim()) throw new Error('Укажите название пресета');
    if (!ids.length) throw new Error('Добавьте хотя бы одно упражнение');
    const db = getDatabase();
    db.withTransactionSync(() => {
        let presetId = id;
        if (presetId !== undefined) {
            const result = db.runSync('UPDATE workout_presets SET name = ? WHERE id = ? AND archived = 0', [name.trim(), presetId]);
            if (!result.changes) throw new Error('Пресет уже удалён');
            db.runSync('DELETE FROM workout_preset_exercises WHERE preset_id = ?', [presetId]);
        } else {
            presetId = db.runSync('INSERT INTO workout_presets (name) VALUES (?)', [name.trim()]).lastInsertRowId;
        }
        ids.forEach((exerciseId, order) => db.runSync(
            'INSERT INTO workout_preset_exercises (preset_id, exercise_id, sort_order) VALUES (?, ?, ?)', [presetId!, exerciseId, order]));
    });
}
export function archivePreset(id: number): void {
    getDatabase().runSync('UPDATE workout_presets SET archived = 1 WHERE id = ?', [id]);
}
