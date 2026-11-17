// src/utils/exportHistory.ts
import type { Workout } from '@/types/workouts';
import { csvCell } from './csv';
import { shareTextFile, type TransferFormat } from './fileTransfer';

export type ExportFormat = TransferFormat;

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
        'exercise_comment',
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
                        ex.comment ?? '',
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
        name: w.name,
        date: w.date,
        comment: w.comment,
        exercises: w.exercises.map((ex) => ({
            name: ex.name,
            type: ex.type,
            comment: ex.comment ?? '',
            sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight })),
        })),
    }));
    return JSON.stringify({ version: 1, workouts: data }, null, 2);
}

/** Пишет файл в кэш и открывает системное меню «Поделиться / Сохранить» */
export async function exportHistory(
    workouts: Workout[],
    format: ExportFormat
): Promise<void> {
    const stamp = new Date().toISOString().slice(0, 10);
    await shareTextFile(
        `workout-history-${stamp}.${format}`,
        format === 'csv' ? workoutsToCsv(workouts) : workoutsToJson(workouts),
        format,
        'Экспорт истории тренировок'
    );
}


export type SingleWorkoutExportFormat = ExportFormat | 'text';
export async function exportWorkout(workout: Workout, format: SingleWorkoutExportFormat): Promise<void> {
    if (format === 'text') {
        const { Share } = await import('react-native');
        const { formatWorkoutDate } = await import('./date');
        const lines = [workout.name, formatWorkoutDate(workout.date), workout.comment];
        for (const exercise of workout.exercises) {
            lines.push('', exercise.name, ...exercise.sets.map((set, index) =>
                `${index + 1}. ${set.reps} × ${set.weight} кг`));
            if (exercise.comment) lines.push(exercise.comment);
        }
        await Share.share({ message: lines.filter((line) => line !== undefined).join('\n') });
        return;
    }
    await shareTextFile(`workout-${workout.id}.${format}`,
        format === 'csv' ? workoutsToCsv([workout]) : workoutsToJson([workout]), format, 'Экспорт тренировки');
}
