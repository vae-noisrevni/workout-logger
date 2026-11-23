import { getDatabase } from './init';
import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';

// Все запросы через это соединение идут по очереди, включая чтение вне транзакций.
let queue: Promise<void> = Promise.resolve();
let restoring = false;

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const task = queue.then(operation);
    queue = task.then(() => undefined, () => undefined);
    return task;
}

function runTransaction<T>(operation: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
    return enqueue(async () => {
        const db = getDatabase();
        let result!: T;
        // На этом соединении внешние ключи включены при инициализации БД.
        await db.withTransactionAsync(async () => { result = await operation(db); });
        return result;
    });
}

export const databaseApi = {
    async restore<T>(operation: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
        if (restoring) throw new Error('Дождитесь восстановления данных');
        restoring = true;
        try {
            return await runTransaction(operation);
        } finally {
            restoring = false;
        }
    },
    all: <T>(sql: string, params: SQLiteBindValue[] = []) =>
        enqueue(() => getDatabase().getAllAsync<T>(sql, params)),
    async transaction<T>(operation: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
        if (restoring) throw new Error('Дождитесь восстановления данных');
        return runTransaction(operation);
    },
};
