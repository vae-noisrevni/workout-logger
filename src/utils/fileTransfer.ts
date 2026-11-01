// src/utils/fileTransfer.ts
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ImportError } from './importError';

export type TransferFormat = 'csv' | 'json';

const MIME: Record<TransferFormat, string> = {
    csv: 'text/csv',
    json: 'application/json',
};
const UTI: Record<TransferFormat, string> = {
    csv: 'public.comma-separated-values-text',
    json: 'public.json',
};

/** Пишет файл в кэш и открывает системное меню «Поделиться / Сохранить» */
export async function shareTextFile(
    fileName: string,
    content: string,
    format: TransferFormat,
    dialogTitle: string,
): Promise<void> {
    const file = new File(Paths.cache, fileName);
    if (file.exists) file.delete();
    file.create();
    file.writeSync(content);

    if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Отправка файлов недоступна на этом устройстве');
    }
    await Sharing.shareAsync(file.uri, {
        mimeType: MIME[format],
        UTI: UTI[format],
        dialogTitle,
    });
}

/**
 * Определяет формат: по расширению, затем по MIME, затем по содержимому.
 * На Android content:// провайдеры часто отдают имя без расширения (или «.json.txt»),
 * а MIME у .csv/.json разный у разных провайдеров — поэтому одного признака мало.
 */
function detectFormat(name: string, mime: string, text: string): TransferFormat | null {
    const lowerName = name.toLowerCase();
    if (/\.json(\.txt)?$/.test(lowerName)) return 'json';
    if (/\.csv(\.txt)?$/.test(lowerName)) return 'csv';

    const lowerMime = mime.toLowerCase();
    if (lowerMime.includes('json')) return 'json';
    if (lowerMime.includes('csv') || lowerMime.includes('comma-separated')) return 'csv';

    const trimmed = text.trimStart();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            JSON.parse(trimmed);
            return 'json';
        } catch {
            // не JSON — пробуем дальше как CSV
        }
    }
    // Похоже на таблицу: в первой строке есть разделитель
    const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? '';
    if (firstLine.includes(',') || firstLine.includes(';')) return 'csv';
    return null;
}

/**
 * Открывает системный выбор файла и читает его как текст.
 * Возвращает null, если пользователь закрыл выбор.
 */
export async function pickTextFile(): Promise<{
    text: string;
    format: TransferFormat;
} | null> {
    const picked = await File.pickFileAsync({ mimeTypes: '*/*' });
    if (picked.canceled) return null;

    const file = picked.result;
    // BOM (часто от Windows-редакторов) ломает JSON.parse и имя первой колонки CSV
    const text = (await file.text()).replace(/^\uFEFF/, '');
    const format = detectFormat(file.name ?? '', file.type ?? '', text);
    if (!format) {
        throw new ImportError('Поддерживаются только файлы .csv и .json');
    }
    return { text, format };
}
