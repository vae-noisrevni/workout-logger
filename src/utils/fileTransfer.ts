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
    file.write(content);

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
 * Открывает системный выбор файла и читает его как текст.
 * Формат определяем по расширению: MIME у .csv/.json разные у разных файловых провайдеров.
 * Возвращает null, если пользователь закрыл выбор.
 */
export async function pickTextFile(): Promise<{
    text: string;
    format: TransferFormat;
} | null> {
    const picked = await File.pickFileAsync({ mimeTypes: '*/*' });
    if (picked.canceled) return null;

    const ext = picked.result.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'json') {
        throw new ImportError('Поддерживаются только файлы .csv и .json');
    }
    return { text: await picked.result.text(), format: ext };
}
