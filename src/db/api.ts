import { getDatabase } from './init';
import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';

// Единая очередь записей не даёт импорту и обычной мутации пересечься.
let restoring = false;
let writes: Promise<unknown> = Promise.resolve();
export const databaseApi = {
    restore<T>(operation: (db: SQLiteDatabase) => Promise<T>) { return this.transaction(operation, true); },
    all: <T>(sql: string, params: SQLiteBindValue[] = []) => getDatabase().getAllAsync<T>(sql, params),
    transaction<T>(operation: (db: SQLiteDatabase) => Promise<T>, restore = false): Promise<T> {
        if (restoring && !restore) return Promise.reject(new Error('Дождитесь восстановления данных'));
        if (restore) restoring = true;
        const task = writes.catch(() => {}).then(async () => {
            let result!: T;
            await getDatabase().withExclusiveTransactionAsync(async (tx) => { result = await operation(tx); });
            return result;
        });
        writes = task;
        return task.finally(() => { if (restore) restoring = false; });
    },
};
