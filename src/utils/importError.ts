// src/utils/importError.ts
const MAX_SHOWN = 5;

/** Ошибка формата/содержимого файла импорта; message можно показывать пользователю как есть */
export class ImportError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ImportError';
    }
}

/** Собирает ошибки валидации в одно сообщение: первые несколько + счётчик остальных */
export function throwIfErrors(errors: string[]): void {
    if (errors.length === 0) return;
    const shown = errors.slice(0, MAX_SHOWN).join('\n');
    const rest = errors.length - MAX_SHOWN;
    throw new ImportError(rest > 0 ? `${shown}\nи ещё ошибок: ${rest}` : shown);
}
