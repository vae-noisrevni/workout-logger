import assert from 'node:assert/strict';
import test from 'node:test';
import { searchWorkoutHistory } from '../src/utils/history.ts';
import { formatWorkoutDate } from '../src/utils/date.ts';

test('Поиск находит упражнения без дублей тренировок и сбрасывается без изменения истории', () => {
    const workouts = [
        { id: 3, exercises: [{ name: 'Жим лёжа' }, { name: 'Жим стоя' }] },
        { id: 2, exercises: [{ name: 'Приседания' }] },
        { id: 1, exercises: [{ name: 'Жим лёжа' }] },
    ];
    const original = structuredClone(workouts);
    const found = searchWorkoutHistory(workouts, '  ЖИМ  ');
    assert.deepEqual(found.map(({ workout }) => workout.id), [3, 1]);
    assert.deepEqual(found[0].matchingNames, ['Жим лёжа', 'Жим стоя']);
    assert.deepEqual(searchWorkoutHistory(workouts, 'тяга'), []);
    assert.deepEqual(searchWorkoutHistory(workouts, ' ').map(({ workout }) => workout), workouts);
    assert.deepEqual(workouts, original);
});

test('Дата и день недели используют локальный день на границе UTC', () => {
    assert.equal(process.env.TZ, 'Europe/Moscow');
    const formatted = formatWorkoutDate('2026-11-15T21:00:00.000Z');
    assert.equal(formatted, '16.11.2026');
});
