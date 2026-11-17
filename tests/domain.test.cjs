const assert = require('node:assert/strict');
const test = require('node:test');
const { harness } = require('./helpers/database.cjs');

test('Месячный прогресс, объём и пороги используют локальный месяц и тип упражнения', () => {
    const { load, sqlite } = harness();
    try {
        const stats = load('src/utils/stats');
        assert.equal(stats.monthKey('2026-08-31T21:00:00.000Z'), '2026-09');
        const rows = [{ date: '2026-07-10', weight: 30, reps: 10 }, { date: '2026-09-10', weight: 20, reps: 8 }];
        const progress = stats.exerciseProgress('assisted', rows);
        assert.equal(progress.previous.month, '2026-07');
        assert.equal(progress.diff, -10);
        assert.equal(progress.improved, true);
        assert.equal(stats.bestSet('weighted', [{ weight: 50, reps: 5 }, { weight: 50, reps: 8 }]).reps, 8);
        assert.equal(stats.exerciseVolume('weighted', [{ weight: 50, reps: 10 }, { weight: 60, reps: 5 }]), 800);
        assert.equal(stats.exerciseVolume('assisted', rows), 18);
        assert.equal(stats.exerciseVolume('bodyweight', rows), 18);
        const monthly = stats.workoutsPerMonth(['2026-08-31T21:00:00.000Z'], new Date('2026-09-16T12:00:00'));
        assert.equal(monthly.length, 12);
        assert.equal(monthly.at(-1).count, 1);
        assert.deepEqual([0, 4, 5, 7, 8, 10].map(stats.activityColor), ['#c62828', '#c62828', '#ef6c00', '#ef6c00', '#2e7d32', '#2e7d32']);
    } finally { sqlite.close(); }
});

test('Миграция старой БД, импорт избранного, пресет → черновик → история и замеры', async () => {
    const fresh = harness();
    try {
        await fresh.load('src/db/init').initializeDatabase();
        assert.deepEqual(fresh.load('src/db/presets').getPresets(), []);
        assert.deepEqual(fresh.load('src/db/bodyWeight').getBodyWeightEntries(), []);
    } finally { fresh.sqlite.close(); }
    const { load, sqlite, restart } = harness(`
        CREATE TABLE exercises (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, description TEXT DEFAULT '');
        CREATE TABLE workouts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, date TEXT NOT NULL);
        INSERT INTO exercises (name, type) VALUES ('Старое упражнение', 'weighted');
        INSERT INTO workouts (name, date) VALUES ('Старая тренировка', '2026-01-01T00:00:00.000Z');
    `);
    try {
        const init = load('src/db/init');
        await init.initializeDatabase();
        restart();
        await load('src/db/init').initializeDatabase();
        const exercises = load('src/db/exercises');
        assert.equal(exercises.getAllExercises()[0].weight_unit, 'kg');
        assert.equal(exercises.getAllExercises()[0].is_favorite, false);
        const transfer = load('src/utils/exerciseTransfer');
        const legacy = transfer.parseExercises('{"exercises":[{"name":"Жим"}]}', 'json');
        assert.equal(legacy[0].is_favorite, false);
        exercises.createExercises(legacy);
        const id = exercises.getAllExercises().find((exercise) => exercise.name === 'Жим').id;
        exercises.setExerciseFavorite(id, true);
        exercises.setExerciseWeightUnit(id, 'lb');
        const exported = transfer.exercisesToJson(exercises.getAllExercises());
        assert.equal(transfer.parseExercises(exported, 'json').find((exercise) => exercise.name === 'Жим').is_favorite, true);
        assert.equal(transfer.parseExercises(transfer.exercisesToCsv(exercises.getAllExercises()), 'csv').find((exercise) => exercise.name === 'Жим').is_favorite, true);
        assert.throws(() => transfer.parseExercises('{"exercises":[{"name":"Жим","favorite":"???"}]}', 'json'));
        const presets = load('src/db/presets');
        presets.savePreset('Понедельник', [id, 1, id]);
        const preset = presets.getPresets()[0];
        assert.deepEqual(preset.exercise_ids, [id, 1]);
        assert.throws(() => presets.savePreset('Поломка', [999999], preset.id));
        assert.deepEqual(presets.getPresets()[0], preset);
        const drafts = load('src/utils/draft');
        let state = drafts.draftFromPreset(preset);
        assert.deepEqual(state.draft.map((exercise) => exercise.sets.length), [0, 0]);
        assert.throws(() => drafts.exercisesForSave(state.draft));
        state.draft[0].sets = [{ id: 'local', weight: 45.359237, reps: 10 }];
        state = drafts.restoreDraft(drafts.serializeDraft(state), null);
        assert.equal(state.origin.preset_name, 'Понедельник');
        const filled = drafts.exercisesForSave(state.draft);
        assert.equal(filled.length, 1);
        const workouts = load('src/db/workouts');
        const workoutId = workouts.createWorkout({ name: 'Выполнение', date: '2026-11-16T00:00:00.000Z', comment: '', exercises: filled, ...state.origin });
        presets.savePreset('Новое название', [id], preset.id);
        presets.archivePreset(preset.id);
        assert.equal(presets.getPresets().length, 0);
        const saved = workouts.getWorkoutById(workoutId);
        assert.equal(saved.preset_name, 'Понедельник');
        assert.equal(saved.exercises.length, 1);
        assert.equal(saved.exercises[0].sets[0].weight, 45.359237);
        assert.equal(drafts.draftFromWorkout(saved).origin.preset_id, preset.id);
        workouts.updateWorkout(workoutId, { ...saved, exercises: filled });
        assert.equal(workouts.getWorkoutById(workoutId).preset_name, 'Понедельник');
        const stats = load('src/db/stats');
        workouts.createWorkout({ name: 'Старый рекорд', date: '2026-02-01T00:00:00.000Z', comment: '', exercises: [{ exercise_id: id, sets: [{ reps: 1, weight: 100 }] }] });
        assert.equal(stats.getLastWorkout(id).sets[0].weight, 45.359237);
        assert.equal(stats.getLastWorkout(id, workoutId).sets[0].weight, 100);
        const log = load('src/db/bodyWeight');
        log.saveBodyWeight('2026-10-10', 80);
        log.saveBodyWeight('2026-11-10', 79.5);
        const entries = log.getBodyWeightEntries();
        assert.equal(entries[0].weight_kg - entries[1].weight_kg, -0.5);
        assert.throws(() => log.saveBodyWeight('2026-11-10', 81));
        assert.throws(() => log.saveBodyWeight('2099-01-01', 80));
        log.saveBodyWeight('2026-09-10', 78, entries[0].id);
        assert.equal(log.getBodyWeightEntries()[0].weight_kg, 80);
        log.deleteBodyWeight(entries[1].id);
        assert.equal(log.getBodyWeightEntries().length, 1);
        exercises.deleteExercise(id);
        assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM workout_preset_exercises WHERE exercise_id = ?').get(id).n, 0);
        assert.equal(workouts.getAllWorkouts().some((workout) => workout.name === 'Старая тренировка'), true);
    } finally { sqlite.close(); }
});

test('Восстановление старого черновика и защита от сохранения некорректных подходов', () => {
    const { load, sqlite } = harness();
    try {
        const drafts = load('src/utils/draft');
        const draft = [{ exercise_id: 1, sets: [{ id: '1', reps: 10, weight: 0 }] }];
        const editing = { id: 9, name: 'Правка', date: '2026-11-10', comment: '' };
        assert.deepEqual(drafts.restoreDraft(JSON.stringify(draft), JSON.stringify(editing)), { draft, editing, origin: null });
        assert.equal(drafts.restoreDraft('{битый', null).draft.length, 0);
        assert.equal(drafts.exercisesForSave(draft).length, 1);
        draft[0].sets[0].reps = 0;
        assert.throws(() => drafts.exercisesForSave(draft));
    } finally { sqlite.close(); }
});

test('Комментарий упражнения и единица веса проходят импорт, правку, JSON/CSV и старые форматы', async () => {
    const { load, sqlite, restart } = harness(`
        CREATE TABLE workout_exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
            exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
            sort_order INTEGER NOT NULL DEFAULT 0
        );
    `);
    try {
        await load('src/db/init').initializeDatabase();
        restart();
        await load('src/db/init').initializeDatabase();
        const exerciseTransfer = load('src/utils/exerciseTransfer');
        const exercises = load('src/db/exercises');
        const workouts = load('src/db/workouts');
        const { parseWorkouts } = load('src/utils/importHistory');
        const { workoutsToJson, workoutsToCsv } = load('src/utils/exportHistory');
        exercises.createExercises(exerciseTransfer.parseExercises('{"exercises":[{"name":"Жим","weight_unit":"lb"}]}', 'json'));
        const exercise = exercises.getAllExercises()[0];
        const comment = 'Ниже опускаемся, до 90°\nБез рывка, "плавно"';
        const parsed = parseWorkouts(JSON.stringify({ workouts: [{ name: 'Перенос', date: '2026-11-16', comment: 'Вес: 78.65',
            exercises: [{ name: 'Жим', comment, sets: [{ reps: 10, weight: 45.359237 }, { reps: 8, weight: 50 }] }] }] }), 'json');
        assert.equal(parsed[0].exercises[0].comment, comment);
        assert.deepEqual(workouts.importWorkouts(parsed), { added: 1, skipped: 0 });
        const saved = workouts.getAllWorkouts()[0];
        assert.equal(saved.exercises[0].comment, comment);
        const draft = load('src/utils/draft').draftFromWorkout(saved);
        assert.equal(load('src/utils/draft').restoreDraft(load('src/utils/draft').serializeDraft(draft), null).draft[0].comment, comment);
        const changedComment = comment + '\nПоследний подход легче';
        draft.draft[0].comment = changedComment;
        workouts.updateWorkout(saved.id, { name: saved.name, date: saved.date, comment: saved.comment, exercises: draft.draft });
        const updated = workouts.getAllWorkouts();
        assert.equal(updated[0].exercises[0].comment, changedComment);
        for (const format of ['json', 'csv']) {
            const exported = format === 'json' ? workoutsToJson(updated) : workoutsToCsv(updated);
            assert.equal(parseWorkouts(exported, format)[0].exercises[0].comment, changedComment);
            assert.equal(parseWorkouts(exported, format)[0].exercises[0].sets[0].weight, 45.359237);
            const exerciseFile = format === 'json' ? exerciseTransfer.exercisesToJson([exercise]) : exerciseTransfer.exercisesToCsv([exercise]);
            assert.equal(exerciseTransfer.parseExercises(exerciseFile, format)[0].weight_unit, 'lb');
        }
        assert.equal(exerciseTransfer.parseExercises('{"exercises":[{"name":"Старое"}]}', 'json')[0].weight_unit, 'kg');
        assert.throws(() => exerciseTransfer.parseExercises('{"exercises":[{"name":"Ошибка","weight_unit":"stone"}]}', 'json'));
        const oldJson = parseWorkouts('{"workouts":[{"name":"Старая","date":"2026-11-15","exercises":[{"name":"Жим","sets":[{"reps":10,"weight":50}]}]}]}', 'json');
        assert.equal(oldJson[0].exercises[0].comment, '');
        assert.equal(parseWorkouts('date,workout,exercise,reps,weight_kg\n2026-11-15,Старая,Жим,10,50', 'csv')[0].exercises[0].comment, '');
        assert.throws(() => parseWorkouts('date,workout,exercise,reps,weight_kg,exercise_comment\n2026-11-15,Старая,Жим,10,50,Первый\n2026-11-15,Старая,Жим,8,50,Другой', 'csv'));
    } finally { sqlite.close(); }
});
