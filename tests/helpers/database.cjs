const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');

// Прогоняем настоящие запросы репозиториев в SQLite, заменяя только нативный транспорт Expo.
function harness(initialSql = '') {
    const sqlite = new DatabaseSync(':memory:');
    if (initialSql) sqlite.exec(initialSql);
    const db = {
        execAsync: async (sql) => sqlite.exec(sql),
        getAllAsync: async (sql,args=[]) => sqlite.prepare(sql).all(...args),
        getAllSync: (sql, args = []) => sqlite.prepare(sql).all(...args),
        getFirstSync: (sql, args = []) => sqlite.prepare(sql).get(...args) ?? null,
        runSync: (sql, args = []) => {
            const result = sqlite.prepare(sql).run(...args);
            return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
        },
        runAsync: async (sql,args=[]) => db.runSync(sql,args),
        withTransactionAsync: async (callback) => {
            sqlite.exec('BEGIN');
            try { await callback(); sqlite.exec('COMMIT'); }
            catch(error) { sqlite.exec('ROLLBACK'); throw error; }
        },
        withTransactionSync: (callback) => {
            sqlite.exec('BEGIN');
            try { callback(); sqlite.exec('COMMIT'); }
            catch (error) { sqlite.exec('ROLLBACK'); throw error; }
        },
    };
    const cache = new Map();
    const root = path.resolve(__dirname, '../..');
    function load(filename) {
        const full = path.resolve(root, filename.endsWith('.ts') ? filename : `${filename}.ts`);
        if (cache.has(full)) return cache.get(full).exports;
        const module = { exports: {} };
        cache.set(full, module);
        const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
        const localRequire = (name) => {
            if (name === 'expo-sqlite') return { openDatabaseAsync: async () => db };
            if (name === './fileTransfer') return { shareTextFile: async () => {} };
            if (!name.startsWith('.') && !name.startsWith('@/') && !path.isAbsolute(name)) return require(name);
            return load(name.startsWith('@/') ? `src/${name.slice(2)}` : path.resolve(path.dirname(full), name));
        };
        vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: full })(localRequire, module, module.exports);
        return module.exports;
    }
    return { load, sqlite, restart: () => cache.clear() };
}


module.exports = { harness };
