// src/utils/exportHistory.ts
import type { Workout, WorkoutExercise } from '@/types/workouts';
import { Share } from 'react-native';
import { csvCell } from './csv';
import { formatLongDate, isoToInputDate } from './date';
import { shareTextFile, type TransferFormat } from './fileTransfer';

export type ExportFormat = TransferFormat;

/** Одна строка CSV = один подход */
export function workoutsToCsv(workouts: Workout[]): string {
    const header = [
        'date',
        'workout',
        'comment',
        'exercise',
        'exercise_comment',
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
                        ex.comment,
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
        name: w.name,
        date: w.date,
        comment: w.comment,
        exercises: w.exercises.map((ex) => ({
            name: ex.name,
            type: ex.type,
            comment: ex.comment,
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

// ─── Одна тренировка ───────────────────────────────────────────────

export type SingleWorkoutExportFormat = ExportFormat | 'text';

function setToText(ex: WorkoutExercise, reps: number, weight: number): string {
    if (ex.type === 'bodyweight') return `${reps} повт.`;
    if (ex.type === 'assisted') return `${reps} × ${weight} кг помощи`;
    return `${reps} × ${weight} кг`;
}

/** Читаемый текст для мессенджера; импорт из него не поддерживается */
export function workoutToText(w: Workout): string {
    const lines = [`${w.name} — ${formatLongDate(w.date)}`];
    if (w.comment) lines.push(w.comment);
    for (const ex of w.exercises) {
        lines.push('', ex.name);
        ex.sets.forEach((s, i) =>
            lines.push(`${i + 1}. ${setToText(ex, s.reps, s.weight)}`)
        );
        if (ex.comment) lines.push(`💬 ${ex.comment}`);
    }
    return lines.join('\n');
}

/** Текст — через системное «Поделиться» сообщением, CSV/JSON — файлом в том же формате, что и история */
export async function exportWorkout(
    workout: Workout,
    format: SingleWorkoutExportFormat
): Promise<void> {
    if (format === 'text') {
        await Share.share({ message: workoutToText(workout) });
        return;
    }
    await shareTextFile(
        `workout-${isoToInputDate(workout.date)}-${workout.id}.${format}`,
        format === 'csv'
            ? workoutsToCsv([workout])
            : workoutsToJson([workout]),
        format,
        'Экспорт тренировки'
    );
}
