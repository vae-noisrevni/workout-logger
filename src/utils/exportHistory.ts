// src/utils/exportHistory.ts
import type { Workout } from '@/types/workouts';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportFormat = 'csv' | 'json';

const csvCell = (v: string | number): string => {
    const s = String(v);
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Одна строка CSV = один подход */
export function workoutsToCsv(workouts: Workout[]): string {
    const header = [
        'date',
        'workout',
        'comment',
        'exercise',
        'type',
        'set',
        'reps',
        'weight_kg',
    ];
    const rows: string[] = [header.join(',')];
    for (const w of workouts) {
        for (const ex of w.exercises) {
            ex.sets.forEach((set, i) => {
                rows.push(
                    [
                        w.date,
                        w.name,
                        w.comment,
                        ex.name,
                        ex.type,
                        i + 1,
                        set.reps,
                        set.weight,
                    ]
                        .map(csvCell)
                        .join(',')
                );
            });
        }
    }
    // BOM, чтобы Excel корректно открыл кириллицу
    return '﻿' + rows.join('\n');
}

export function workoutsToJson(workouts: Workout[]): string {
    const data = workouts.map((w) => ({
        id: w.id,
        name: w.name,
        date: w.date,
        comment: w.comment,
        exercises: w.exercises.map((ex) => ({
            name: ex.name,
            type: ex.type,
            sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight })),
        })),
    }));
    return JSON.stringify(data, null, 2);
}

/** Пишет файл в кэш и открывает системное меню «Поделиться / Сохранить» */
export async function exportHistory(
    workouts: Workout[],
    format: ExportFormat
): Promise<void> {
    const stamp = new Date().toISOString().slice(0, 10);
    const file = new File(Paths.cache, `workout-history-${stamp}.${format}`);
    if (file.exists) file.delete();
    file.create();
    file.write(
        format === 'csv' ? workoutsToCsv(workouts) : workoutsToJson(workouts)
    );

    if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Отправка файлов недоступна на этом устройстве');
    }
    await Sharing.shareAsync(file.uri, {
        mimeType: format === 'csv' ? 'text/csv' : 'application/json',
        UTI: format === 'csv' ? 'public.comma-separated-values-text' : 'public.json',
        dialogTitle: 'Экспорт истории тренировок',
    });
}
