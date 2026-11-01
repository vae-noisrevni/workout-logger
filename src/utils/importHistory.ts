// src/utils/importHistory.ts
import type { ImportedWorkout } from '@/types/workouts';
import { detectDelimiter, parseCsv } from './csv';
import { inputDateToIso } from './date';
import type { TransferFormat } from './fileTransfer';
import { ImportError, throwIfErrors } from './importError';

/** 'YYYY-MM-DD' или любая ISO-строка → ISO; null, если дата не распознана */
function parseDate(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return inputDateToIso(s);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Принимает число или строку с запятой/точкой как разделителем дробной части */
function parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') {
        return Number(value.trim().replace(',', '.'));
    }
    return NaN;
}

type Raw = Record<string, unknown>;

function toWorkout(
    raw: Raw,
    where: string,
    errors: string[],
): ImportedWorkout | null {
    const before = errors.length;
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!name) errors.push(`${where}: не указано название (name)`);

    const date = parseDate(raw.date);
    if (!date) errors.push(`${where}: date должна быть вида ГГГГ-ММ-ДД или ISO`);

    const exercises: ImportedWorkout['exercises'] = [];
    if (!Array.isArray(raw.exercises) || raw.exercises.length === 0) {
        errors.push(`${where}: нужен непустой массив exercises`);
    } else {
        raw.exercises.forEach((exRaw, ei) => {
            const exWhere = `${where}, упражнение ${ei + 1}`;
            const ex = (exRaw ?? {}) as Raw;
            const exName = typeof ex.name === 'string' ? ex.name.trim() : '';
            if (!exName) errors.push(`${exWhere}: не указано название (name)`);
            if (!Array.isArray(ex.sets) || ex.sets.length === 0) {
                errors.push(`${exWhere}: нужен непустой массив sets`);
                return;
            }
            const sets = ex.sets.map((sRaw, si) => {
                const s = (sRaw ?? {}) as Raw;
                const reps = parseNumber(s.reps);
                const weight = parseNumber(s.weight);
                if (!Number.isInteger(reps) || reps < 1) {
                    errors.push(`${exWhere}, подход ${si + 1}: reps — целое число ≥ 1`);
                }
                if (!Number.isFinite(weight) || weight < 0) {
                    errors.push(`${exWhere}, подход ${si + 1}: weight — число ≥ 0`);
                }
                return { reps, weight };
            });
            exercises.push({
                name: exName,
                comment: typeof ex.comment === 'string' ? ex.comment.trim() : '',
                sets,
            });
        });
    }

    if (errors.length > before || !date) return null;
    return {
        name,
        date,
        comment: typeof raw.comment === 'string' ? raw.comment.trim() : '',
        exercises,
    };
}

export function parseWorkouts(
    text: string,
    format: TransferFormat,
): ImportedWorkout[] {
    const errors: string[] = [];
    const result: ImportedWorkout[] = [];

    if (format === 'json') {
        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            throw new ImportError('Файл не является корректным JSON');
        }
        // Допускаем и «голый» массив (так экспортировали старые версии)
        const list = Array.isArray(data)
            ? data
            : (data as { workouts?: unknown } | null)?.workouts;
        if (!Array.isArray(list)) {
            throw new ImportError('Ожидается объект с массивом workouts');
        }
        list.forEach((item, i) => {
            const w =
                item && typeof item === 'object'
                    ? toWorkout(item as Raw, `Тренировка ${i + 1}`, errors)
                    : (errors.push(`Тренировка ${i + 1}: ожидается объект`), null);
            if (w) result.push(w);
        });
    } else {
        const rows = parseCsv(text, detectDelimiter(text));
        if (rows.length === 0) throw new ImportError('Файл пуст');
        const header = rows[0].map((h) => h.trim().toLowerCase());
        const required = ['date', 'workout', 'exercise', 'reps', 'weight_kg'];
        const missing = required.filter((c) => !header.includes(c));
        if (missing.length > 0) {
            throw new ImportError(
                `В заголовке CSV нет обязательных колонок: ${missing.join(', ')}`,
            );
        }

        // Одна строка = один подход. Тренировка определяется парой (date, workout),
        // упражнение — названием внутри неё; порядок берётся из порядка строк.
        const workouts = new Map<string, Raw & { exercises: Map<string, Raw[]> }>();
        rows.slice(1).forEach((cells) => {
            const row: Record<string, string> = {};
            header.forEach((h, idx) => (row[h] = (cells[idx] ?? '').trim()));

            const key = `${row.date}\u0000${row.workout}`;
            let w = workouts.get(key);
            if (!w) {
                w = {
                    name: row.workout,
                    date: row.date,
                    comment: row.comment ?? '',
                    exercises: new Map(),
                };
                workouts.set(key, w);
            }
            const sets = w.exercises.get(row.exercise) ?? [];
            sets.push({ reps: row.reps, weight: row.weight_kg });
            w.exercises.set(row.exercise, sets);
        });

        let i = 0;
        for (const w of workouts.values()) {
            i++;
            const w2 = toWorkout(
                {
                    ...w,
                    exercises: [...w.exercises].map(([name, sets]) => ({
                        name,
                        sets,
                    })),
                },
                `Тренировка ${i} («${w.name}», ${w.date})`,
                errors,
            );
            if (w2) result.push(w2);
        }
    }

    throwIfErrors(errors);
    if (result.length === 0) throw new ImportError('В файле нет тренировок');
    return result;
}
