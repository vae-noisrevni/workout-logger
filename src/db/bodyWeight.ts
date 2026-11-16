import { getDatabase } from './init';
import type { BodyWeightEntry } from '@/types/bodyWeight';
import { inputDateToIso, todayInputDate } from '@/utils/date';

export function getBodyWeightEntries(): BodyWeightEntry[] {
    return getDatabase().getAllSync<BodyWeightEntry>('SELECT id, date, weight_kg FROM body_weight_entries ORDER BY date DESC, id DESC');
}
export function saveBodyWeight(date: string, weight: number, id?: number): void {
    if (!inputDateToIso(date) || date > todayInputDate()) throw new Error('Укажите существующую дату не позже сегодняшней');
    if (!Number.isFinite(weight) || weight <= 0) throw new Error('Вес должен быть положительным числом');
    const db = getDatabase();
    if (id !== undefined) db.runSync('UPDATE body_weight_entries SET date = ?, weight_kg = ? WHERE id = ?', [date, weight, id]);
    else db.runSync('INSERT INTO body_weight_entries (date, weight_kg) VALUES (?, ?)', [date, weight]);
}
export function deleteBodyWeight(id: number): void {
    getDatabase().runSync('DELETE FROM body_weight_entries WHERE id = ?', [id]);
}
