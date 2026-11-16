// src/utils/exerciseTransfer.ts
import { DEFAULT_EXERCISE_COLOR } from '@/constants/exerciseColors';
import type {
    CreateExerciseInput,
    Exercise,
    ExerciseType,
} from '@/types/exercise';
import { csvCell, detectDelimiter, parseCsv } from './csv';
import { shareTextFile, type TransferFormat } from './fileTransfer';
import { ImportError, throwIfErrors } from './importError';

const TYPES: ExerciseType[] = ['weighted', 'assisted', 'bodyweight'];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// ─── Экспорт ───────────────────────────────────────────────────────

export function exercisesToCsv(exercises: Exercise[]): string {
    const rows = [
        'name,type,description,color,favorite,weight_unit',
        ...exercises.map((e) =>
            [e.name, e.type, e.description, e.color, String(e.is_favorite), e.weight_unit].map(csvCell).join(','),
        ),
    ];
    // BOM, чтобы Excel корректно открыл кириллицу
    return '﻿' + rows.join('\n');
}

export function exercisesToJson(exercises: Exercise[]): string {
    const data = exercises.map((e) => ({
        name: e.name,
        type: e.type,
        description: e.description,
        color: e.color,
        favorite: e.is_favorite,
        weight_unit: e.weight_unit,
    }));
    return JSON.stringify({ version: 1, exercises: data }, null, 2);
}

export async function exportExercises(
    exercises: Exercise[],
    format: TransferFormat,
): Promise<void> {
    const stamp = new Date().toISOString().slice(0, 10);
    await shareTextFile(
        `workout-exercises-${stamp}.${format}`,
        format === 'csv' ? exercisesToCsv(exercises) : exercisesToJson(exercises),
        format,
        'Экспорт упражнений',
    );
}

// ─── Импорт ────────────────────────────────────────────────────────

type RawExercise = Record<string, unknown>;

function toExercise(
    raw: RawExercise,
    where: string,
    errors: string[],
): CreateExerciseInput | null {
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!name) {
        errors.push(`${where}: не указано название (name)`);
        return null;
    }

    const typeRaw =
        typeof raw.type === 'string' && raw.type.trim() !== ''
            ? raw.type.trim().toLowerCase()
            : 'weighted';
    if (!TYPES.includes(typeRaw as ExerciseType)) {
        errors.push(
            `${where}: неизвестный type «${typeRaw}», допустимо: ${TYPES.join(', ')}`,
        );
        return null;
    }

    const colorRaw =
        typeof raw.color === 'string' && raw.color.trim() !== ''
            ? raw.color.trim()
            : DEFAULT_EXERCISE_COLOR;
    if (!HEX_COLOR.test(colorRaw)) {
        errors.push(`${where}: color «${colorRaw}» должен быть вида #RRGGBB`);
        return null;
    }

    const unit = raw.weight_unit === undefined || raw.weight_unit === null || raw.weight_unit === ''
        ? 'kg' : typeof raw.weight_unit === 'string' ? raw.weight_unit.trim().toLowerCase() : null;
    if (unit !== 'kg' && unit !== 'lb') {
        errors.push(`${where}: weight_unit должен быть kg или lb`);
        return null;
    }
    const favorite = parseFavorite(raw.favorite);
    if (favorite === null) {
        errors.push(`${where}: favorite должен быть true или false`);
        return null;
    }
    return {
        is_favorite: favorite,
        weight_unit: unit,
        name,
        type: typeRaw as ExerciseType,
        description:
            typeof raw.description === 'string' ? raw.description.trim() : '',
        color: colorRaw,
    };
}

export function parseExercises(
    text: string,
    format: TransferFormat,
): CreateExerciseInput[] {
    const errors: string[] = [];
    const result: CreateExerciseInput[] = [];

    if (format === 'json') {
        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            throw new ImportError('Файл не является корректным JSON');
        }
        // Допускаем и «голый» массив
        const list = Array.isArray(data)
            ? data
            : (data as { exercises?: unknown } | null)?.exercises;
        if (!Array.isArray(list)) {
            throw new ImportError('Ожидается объект с массивом exercises');
        }
        list.forEach((item, i) => {
            const ex =
                item && typeof item === 'object'
                    ? toExercise(item as RawExercise, `Упражнение ${i + 1}`, errors)
                    : (errors.push(`Упражнение ${i + 1}: ожидается объект`), null);
            if (ex) result.push(ex);
        });
    } else {
        const rows = parseCsv(text, detectDelimiter(text));
        if (rows.length === 0) throw new ImportError('Файл пуст');
        const header = rows[0].map((h) => h.trim().toLowerCase());
        if (!header.includes('name')) {
            throw new ImportError('В заголовке CSV нет обязательной колонки name');
        }
        rows.slice(1).forEach((cells, i) => {
            const raw: RawExercise = {};
            header.forEach((h, idx) => (raw[h] = cells[idx] ?? ''));
            const ex = toExercise(raw, `Строка ${i + 2}`, errors);
            if (ex) result.push(ex);
        });
    }

    throwIfErrors(errors);
    if (result.length === 0) throw new ImportError('В файле нет упражнений');
    return result;
}

export function parseFavorite(value: unknown): boolean | null {
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return null;
    const text = value.trim().toLowerCase();
    if (!text || ['false', '0', 'нет', 'no'].includes(text)) return false;
    return ['true', '1', 'да', 'yes'].includes(text) ? true : null;
}
