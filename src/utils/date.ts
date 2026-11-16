// src/utils/date.ts
const MONTHS_RU = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
];

export function formatWorkoutDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function defaultWorkoutName(date: Date = new Date()): string {
    return `Тренировка от ${date.getDate()} ${MONTHS_RU[date.getMonth()]}`;
}

/** ISO-строка (как хранится в БД) → 'YYYY-MM-DD' для инпута */
export function isoToInputDate(iso: string): string {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' → ISO-строка. Возвращает null, если формат неверный */
export function inputDateToIso(input: string): string | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
    if (!match) return null;
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (isNaN(date.getTime())) return null;
    // Проверка, что дата не «уехала» (например, 2026-02-31 → 3 марта)
    if (
        date.getFullYear() !== Number(y) ||
        date.getMonth() !== Number(m) - 1 ||
        date.getDate() !== Number(d)
    ) {
        return null;
    }
    return date.toISOString();
}

export function todayInputDate(): string {
    return isoToInputDate(new Date().toISOString());
}

export function yesterdayInputDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return isoToInputDate(d.toISOString());
}

const MONTHS_SHORT_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_DATIVE_RU = ['январю', 'февралю', 'марту', 'апрелю', 'маю', 'июню', 'июлю', 'августу', 'сентябрю', 'октябрю', 'ноябрю', 'декабрю'];
export const monthShortLabel = (key: string) => MONTHS_SHORT_RU[Number(key.slice(5)) - 1];
export const monthDativeLabel = (key: string, relativeTo: string) =>
    `${MONTHS_DATIVE_RU[Number(key.slice(5)) - 1]}${key.slice(0, 4) === relativeTo.slice(0, 4) ? '' : ` ${key.slice(0, 4)}`}`;
