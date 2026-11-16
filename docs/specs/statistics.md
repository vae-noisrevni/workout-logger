# Спека: статистика, избранное и калькулятор подходов

Исходные пункты задачи:

- блок со статистикой;
- топ показателей по избранным упражнениям;
- прогресс в месяц, количество тренировок в месяц;
- калькулятор подходов, веса и повторений по текущему рабочему показателю.

Спека описывает и поведение, и привязку к коду: какие файлы меняются, сигнатуры, SQL.

---

## 0. Сводка решений

| Вопрос | Решение |
|---|---|
| Где статистика | Новый таб «Статистика» (`src/app/(tabs)/stats.tsx`) |
| Избранное | Ручная звёздочка: колонка `is_favorite` в `exercises` |
| Где ставится звезда | В `ExerciseRow` (тап по звезде) и переключатель в `ExerciseForm` |
| Топ-показатель | «Лучший подход», зависит от типа (см. 3.1) |
| Прогресс в месяц | Дельта лучшего показателя между двумя последними месяцами с данными |
| Тренировки в месяц | Столбики за последние 12 календарных месяцев, на своих `View` |
| Рабочий показатель | Лучший подход последней тренировки с упражнением, можно поправить руками |
| Калькулятор | Цель → подходы × повторы × вес, формула Эпли с RIR 2, шаг 2.5 кг |
| Точки входа калькулятора | Карточка в топе, отдельный блок в табе с выбором любого упражнения, `SetsSheet` |
| Калькулятор в `SetsSheet` | Раскрывающийся блок внутри шторки, не отдельная шторка |
| «Применить» поверх введённых подходов | Замена с подтверждением через `ConfirmDialog` |
| Экспорт/импорт | Опциональное поле `favorite`, старые файлы валидны |
| Новые зависимости | Нет |

---

## 1. Что уже есть в коде и влияет на реализацию

1. **Даты тренировок хранятся в UTC.** `inputDateToIso` (`src/utils/date.ts`) берёт локальную полночь и сохраняет её через `toISOString()`. При UTC+3 тренировка 1 сентября лежит в БД как `2026-08-31T21:00:00.000Z`. Поэтому **группировать по месяцам в SQL через `strftime` нельзя**, это делается в JS через `new Date(iso).getFullYear()/getMonth()`.
2. **SQLite отдаёт `INTEGER`-флаги числом 0/1.** `getAllSync<Exercise>` сейчас ничего не маппит. После добавления `is_favorite` нужен явный маппинг строки в `Exercise`, иначе в типе будет `boolean`, а в рантайме `0 | 1`.
3. **`CreateExerciseInput = Omit<Exercise, 'id'>`.** Как только в `Exercise` появится `is_favorite`, он станет обязательным во всех местах, где создаётся упражнение: `ExerciseForm.onSubmit`, `parseExercises`. TypeScript сам покажет все такие места.
4. **В черновике не бывает пустого упражнения.** `addExercise` сразу создаёт один подход `{ reps: 10, weight: 0 }` (`createEmptySet` в `useWorkoutDraft.ts`). Из-за этого «подходов нет» для «Применить» определяется по-другому (см. 5.4).
5. **Для `bodyweight` поле веса в `SetsSheet` скрыто**, там `weight` всегда 0. Для `assisted` в `weight` хранится вес помощи.
6. **Инвалидация данных.** Сохранение и удаление тренировок вызывают `bumpWorkouts()`, изменения упражнений — `bumpExercises()` (`DataVersionContext`). Статистика подписывается на оба `revision`.
7. **Мёртвый код, к задаче не относится:** `useHistory` и `WorkoutsVersionContext` не используются, их `bump` никто не вызывает. Если удалять — отдельным коммитом.
8. `src/components/ui/collapsible.tsx` сломан (импортирует несуществующий `themed-text`), переиспользовать его нельзя.

---

## 2. Избранное

### 2.1 БД — `src/db/init.ts`

Миграция по образцу `migrateExercisesColor`:

```ts
async function migrateExercisesFavorite(): Promise<void> {
    // PRAGMA table_info(exercises) → если колонки is_favorite нет:
    // ALTER TABLE exercises ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
}
```

Вызывается в `initializeDatabase()` после `migrateWorkoutsComment()`. В `CREATE TABLE exercises` колонку тоже добавить, чтобы на свежей установке миграция была no-op.

`src/db/schema.ts` устарел (в нём старая схема без `workout_sets`) и нигде не используется, трогать не нужно.

### 2.2 Типы — `src/types/exercise.ts`

```ts
export interface Exercise {
    // ...
    is_favorite: boolean;
}
```

### 2.3 Репозиторий — `src/db/exercises.ts`

- Внутренний тип строки `ExerciseDbRow` с `is_favorite: number` и функция `toExercise(row): Exercise` с `is_favorite: row.is_favorite === 1`.
- `getAllExercises`, `getExercisesBySearch`, `updateExercise` (выборка `existing`): добавить `is_favorite` в `SELECT` и маппить строки.
- `insertExercise`: писать `input.is_favorite ? 1 : 0`.
- `updateExercise`: `is_favorite = ?` со значением `(input.is_favorite ?? existing.is_favorite) ? 1 : 0`.
- Новая функция для тапа по звезде, чтобы не гонять всю форму:

```ts
export function setExerciseFavorite(id: number, value: boolean): void
// UPDATE exercises SET is_favorite = ? WHERE id = ?
```

### 2.4 Хук — `src/hooks/useExercises.ts`

Добавить `toggleFavorite(exercise: Exercise)`: вызывает `setExerciseFavorite(exercise.id, !exercise.is_favorite)`, потом `bumpExercises()`.

### 2.5 UI

**`ExerciseRow`**:
- новый проп `onToggleFavorite: () => void`;
- справа, перед `chevron-forward`, ставится `Pressable` с иконкой `star` / `star-outline` (Ionicons) и `hitSlop={10}`;
- цвет: залитая звезда — `colors.accent`, контурная — `colors.textSecondary`;
- вложенный `Pressable` перехватывает тап, поэтому `onPress` строки (открыть форму) при тапе по звезде не срабатывает.

**`exercises.tsx`**: `onToggleFavorite={() => toggleFavorite(item)}`.

**`ExerciseForm`**: state `isFavorite` из `initial?.is_favorite ?? false`. Строка-переключатель «Избранное» со звездой, по стилю как остальные поля формы. Значение передаётся в `onSubmit`.

### 2.6 Экспорт/импорт — `src/utils/exerciseTransfer.ts`

- **CSV-экспорт:** заголовок `name,type,description,color,favorite`, значение `true` / `false`.
- **JSON-экспорт:** поле `favorite: boolean`. `version` остаётся `1`, потому что поле опциональное и обратно совместимое.
- **Импорт** (`toExercise`), правило `parseFavorite(raw.favorite)`:
  - `undefined`, `null`, пустая строка → `false`;
  - `boolean` → как есть;
  - строка `true` / `1` / `да` / `yes` (регистр не важен) → `true`, строка `false` / `0` / `нет` / `no` → `false`;
  - любое другое значение → ошибка `${where}: favorite «…» должен быть true или false`.
- Документация: `docs/formats/README.md` (таблица полей и заголовок CSV), `docs/formats/exercises.schema.json` (`"favorite": { "type": "boolean" }`, не в `required`), примеры `docs/formats/examples/exercises.{csv,json}` (хотя бы у одного упражнения `true`).
- Импорт истории (`importHistory.ts`) не меняется.

---

## 3. Расчёты статистики (чистые функции)

Новый файл `src/utils/stats.ts`. Здесь нет React и БД, поэтому его легко тестировать.

### 3.1 Лучший показатель подхода по типу

| Тип | Значение подхода | Лучше | Единица |
|---|---|---|---|
| `weighted` | `weight` | больше | кг |
| `assisted` | `weight` (помощь) | **меньше** | кг |
| `bodyweight` | `reps` | больше | повт. |

```ts
export interface SetLike { reps: number; weight: number }

/** Значение, по которому сравниваем подходы данного типа */
export function setValue(type: ExerciseType, set: SetLike): number

/** true, если a лучше b для данного типа */
export function isBetter(type: ExerciseType, a: number, b: number): boolean

/** Лучшее значение среди подходов; null, если подходов нет */
export function bestValue(type: ExerciseType, sets: SetLike[]): number | null

export function valueUnit(type: ExerciseType): 'кг' | 'повт.'
```

### 3.2 Месяц

```ts
/** 'YYYY-MM' в ЛОКАЛЬНОМ времени (см. п. 1.1) */
export function monthKey(iso: string): string
```

### 3.3 Прогресс упражнения

```ts
export interface StatSetRow {
    workout_id: number;
    date: string;      // ISO из workouts.date
    exercise_id: number;
    reps: number;
    weight: number;
}

export interface MonthValue { month: string; value: number } // month = 'YYYY-MM'

export interface ExerciseProgress {
    best: number | null;           // лучшее за всё время
    latest: MonthValue | null;     // последний месяц с данными
    previous: MonthValue | null;   // предыдущий месяц с данными (до latest)
    diff: number | null;           // latest.value - previous.value, «сырая» разница
    improved: boolean | null;      // isBetter(type, latest, previous); null, если diff = 0 или нет данных
}

export function exerciseProgress(type: ExerciseType, rows: StatSetRow[]): ExerciseProgress
```

Алгоритм: сгруппировать `rows` по `monthKey(date)`, для каждого месяца взять `bestValue`, отсортировать ключи. `latest` — последний ключ, `previous` — предпоследний. Пропуск месяцев допустим: например, сентябрь сравнивается с июлем.

### 3.4 Тренировки по месяцам

```ts
export interface MonthCount { month: string; count: number }

/** 12 записей от старого месяца к текущему; месяцы без тренировок — count 0 */
export function workoutsPerMonth(dates: string[], now: Date, months = 12): MonthCount[]
```

`now` передаётся параметром, чтобы функцию можно было тестировать без мока даты.

### 3.5 Подписи месяцев — `src/utils/date.ts`

В `date.ts` уже есть `MONTHS_RU` в родительном падеже. Нужно добавить:

- `MONTHS_SHORT_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']` — подписи столбиков;
- `MONTHS_DATIVE_RU = ['январю', 'февралю', 'марту', 'апрелю', 'маю', 'июню', 'июлю', 'августу', 'сентябрю', 'октябрю', 'ноябрю', 'декабрю']` — для подписи «к августу»;
- `monthShortLabel(key)` и `monthDativeLabel(key, relativeTo)`. Год добавляется, только если он отличается от года `relativeTo`: «к декабрю 2025».

---

## 4. Данные для статистики

### 4.1 Репозиторий — `src/db/stats.ts`

```ts
/** Все подходы указанных упражнений с датой тренировки */
export function getSetsForExercises(exerciseIds: number[]): StatSetRow[]
```

```sql
SELECT w.id AS workout_id, w.date, we.exercise_id, ws.reps, ws.weight
FROM workout_sets ws
JOIN workout_exercises we ON we.id = ws.workout_exercise_id
JOIN workouts w ON w.id = we.workout_id
WHERE we.exercise_id IN (?, ?, …)  -- плейсхолдеры по числу id; пустой массив → сразу []
ORDER BY w.date ASC
```

```ts
/** Даты всех тренировок (фильтр по 12 месяцам — в JS, см. п. 1.1) */
export function getAllWorkoutDates(): string[]
// SELECT date FROM workouts
```

```ts
/**
 * Подходы упражнения из последней тренировки, где оно было.
 * excludeWorkoutId — тренировка, которая сейчас редактируется: её не берём,
 * иначе рабочим показателем станут её же старые подходы.
 */
export function getLastWorkoutSets(exerciseId: number, excludeWorkoutId?: number): SetLike[]
```

```sql
SELECT ws.reps, ws.weight
FROM workout_sets ws
WHERE ws.workout_exercise_id = (
    SELECT we.id
    FROM workout_exercises we
    JOIN workouts w ON w.id = we.workout_id
    WHERE we.exercise_id = ? AND w.id != ?   -- excludeWorkoutId ?? -1
    ORDER BY w.date DESC, w.id DESC
    LIMIT 1
)
ORDER BY ws.sort_order ASC
```

Сортировка по ISO-строке `date` корректна: все даты в одном формате `toISOString()`.

### 4.2 Хук — `src/hooks/useStats.ts`

```ts
export interface FavoriteStat {
    exercise: Exercise;
    progress: ExerciseProgress;
}

export function useStats(): {
    favorites: FavoriteStat[];      // в порядке getAllExercises (по имени)
    monthly: MonthCount[];
    loading: boolean;
    error: string | null;
}
```

- Устроен так же, как `useWorkouts`: `load` в `useCallback`, `useEffect` с зависимостями `[load, workoutsRevision, exercisesRevision]`, ошибка пишется в `error`.
- Список избранного: `getAllExercises().filter((e) => e.is_favorite)`. Затем один запрос `getSetsForExercises(ids)`, группировка по `exercise_id`, для каждой группы вызывается `exerciseProgress`.
- `monthly = workoutsPerMonth(getAllWorkoutDates(), new Date())`.

---

## 5. Калькулятор подходов

### 5.1 Чистые функции — `src/utils/calculator.ts`

```ts
export type Goal = 'strength' | 'hypertrophy' | 'endurance';

export const GOALS: Record<Goal, { label: string; sets: number; reps: number }> = {
    strength:    { label: 'Сила',         sets: 4, reps: 5 },
    hypertrophy: { label: 'Масса',        sets: 3, reps: 10 },
    endurance:   { label: 'Выносливость', sets: 3, reps: 15 },
};

export const WEIGHT_STEP = 2.5;
export const RIR = 2;

export interface Plan { sets: number; reps: number; weight: number }

/** Эпли; при r = 1 возвращает w */
export function epley1RM(weight: number, reps: number): number

/** Округление вниз к шагу, не меньше 0 */
export function roundDownToStep(value: number, step = WEIGHT_STEP): number

/** Рабочий подход из подходов последней тренировки; null, если подходов нет */
export function pickWorkingSet(type: ExerciseType, sets: SetLike[]): SetLike | null

/** План по цели; null, если рабочий показатель невалиден (см. 5.2) */
export function calculatePlan(type: ExerciseType, working: SetLike, goal: Goal): Plan | null

/** План → подходы для черновика */
export function planToSets(plan: Plan): Array<{ reps: number; weight: number }>
```

**`pickWorkingSet`:**
- `weighted` — подход с максимальным `epley1RM`; при равенстве берём тот, где больше вес;
- `bodyweight` — подход с максимальными `reps`;
- `assisted` — подход с минимальным `weight`; при равенстве берём тот, где больше `reps`.

**`calculatePlan`**, где `G = GOALS[goal]`:

| Тип | Подходы | Повторы | Вес |
|---|---|---|---|
| `weighted` | `G.sets` | `G.reps` | `roundDownToStep(epley1RM(w, r) / (1 + (G.reps + RIR) / 30))` |
| `bodyweight` | `G.sets` | `max(1, round(M × k))`, `k`: сила 0.5, масса 0.7, выносливость 0.85, `M = working.reps` | 0 |
| `assisted` | `G.sets` | `G.reps` | сила `a − 5`, масса `a`, выносливость `a + 5`, затем `roundDownToStep`, `a = working.weight` |

Правила для `bodyweight` и `assisted` — эвристики. Коэффициенты и шаг ±5 кг вынесены в константы рядом с `GOALS`.

### 5.2 Валидация

`calculatePlan` возвращает `null`, если выполняется хотя бы одно:
- `working.reps < 1`;
- `weighted` и `working.weight <= 0`;
- `weighted` и расчётный вес после округления получился `0`.

Если план `null`, UI вместо результата показывает «Введите рабочий вес и повторы».

### 5.3 Компонент — `src/components/SetCalculator/SetCalculator.tsx`

```ts
interface Props {
    exercise: Pick<Exercise, 'id' | 'name' | 'type'>;
    colors: ThemeColors;
    /** id редактируемой тренировки — исключается из «последней тренировки» */
    excludeWorkoutId?: number;
    /** Есть только в SetsSheet; без него кнопки «Применить» нет */
    onApply?: (sets: Array<{ reps: number; weight: number }>) => void;
}
```

- Начальные значения: `pickWorkingSet(type, getLastWorkoutSets(id, excludeWorkoutId))`. Берутся через `useMemo` с зависимостями `exercise.id`, `excludeWorkoutId`, `workoutsRevision`.
- Локальный state `weight`, `reps` и `goal` (по умолчанию `'hypertrophy'`). При смене `exercise.id` state сбрасывается; проще всего сделать это через `key={exercise.id}` снаружи.
- Поля вводятся через существующий `NumberStepperField`:
  - «Повторения» — для всех типов;
  - «Вес (кг)» (`step={2.5}`, `decimal`) — для `weighted`;
  - «Помощь (кг)» — для `assisted`;
  - для `bodyweight` поля веса нет, как в `SetsSheet`.
- Если истории нет, поля пустые: `0` у `NumberStepperField`, а под ними подсказка «Нет истории — введите рабочий подход».
- Цель выбирается сегментным переключателем из трёх `Pressable`. Активный сегмент — `colors.accent` и `colors.textInverse`.
- Результат — крупная строка «4 × 5 × 92.5 кг». Для `bodyweight` — «4 × 6», для `assisted` — «3 × 10, помощь 20 кг».
- Кнопка «Применить» показывается, только если передан `onApply` и план не `null`.
- Ручная правка нигде не сохраняется.

### 5.4 Встраивание в `SetsSheet`

- Новые пропсы: `onReplaceSets: (exerciseId: number, sets: Array<{ reps: number; weight: number }>) => void` и `excludeWorkoutId?: number`.
- Над `setsList` стоит кнопка-строка «Рассчитать подходы» с иконкой `calculator-outline` и chevron. Локальный `useState` раскрывает и сворачивает блок с `<SetCalculator key={exercise.exercise_id} … />`. Анимация не обязательна.
- `onApply` внутри `SetsSheet` работает так:
  - черновик считается **«пустым»**, если в нём ровно 1 подход и он равен дефолту `{ reps: 10, weight: 0 }` (см. п. 1.4);
  - пустой → `onReplaceSets(...)` вызывается сразу и блок сворачивается;
  - иначе → `useDialog().show({ title: 'Заменить подходы?', message: 'Сейчас N подх. — они будут заменены расчётом', buttons: [{ text: 'Отмена', style: 'cancel' }, { text: 'Заменить', style: 'destructive', onPress: () => onReplaceSets(...) }] })`.
- Дефолт `{ reps: 10, weight: 0 }` лучше вынести из `useWorkoutDraft.ts` в экспортируемую константу `DEFAULT_SET`, чтобы проверка «пустоты» не дублировала магические числа.

### 5.5 Черновик — `src/hooks/useWorkoutDraft.ts`

```ts
const replaceSets = useCallback(
    (exerciseId: number, sets: Array<{ reps: number; weight: number }>) => {
        // d.sets = sets.map((s) => ({ id: createSetId(), ...s })) для exercise_id === exerciseId
    },
    [],
);
```

Функция добавляется в возвращаемый объект. Тип `WorkoutDraftContext` выводится через `ReturnType`, поэтому подхватится автоматически.

**`index.tsx`**: передать в `SetsSheet` `onReplaceSets={draft.replaceSets}` и `excludeWorkoutId={draft.editing?.id}`.

---

## 6. Таб «Статистика»

### 6.1 Роутинг — `src/app/(tabs)/_layout.tsx`

Новый `Tabs.Screen` с `name="stats"`, `title: 'Статистика'`, `headerRight: () => <ThemeToggle />` и иконкой `stats-chart-outline`. Таб ставится последним, после «Истории».

### 6.2 Экран — `src/app/(tabs)/stats.tsx`

`ScrollView`, фон `colors.background`, три секции сверху вниз:

**1. «Избранное»** — список `FavoriteStatCard`:
- если избранного нет: текст «Отметьте упражнения звёздочкой на вкладке „Упражнения“» и `Link href="/exercises"`;
- тап по карточке ставит `calcExercise = exercise` и открывает `BottomSheet` с `<SetCalculator key={id} exercise=… />` без `onApply`. Шторка устроена так же, как в `exercises.tsx`: `sheetMode`-state, `snapPoints={['60%', '90%']}`, `enablePanDownToClose`.

**2. «Тренировки по месяцам»** — `MonthlyBars`.

**3. «Калькулятор»**:
- поле-кнопка «Упражнение: <название> ▾» открывает `BottomSheet` со списком всех упражнений и поиском (фильтрация как `availableExercises` в `index.tsx`);
- под полем — `<SetCalculator key={id} … />` без `onApply`;
- пока упражнение не выбрано, показывается только поле.

Используется одна шторка с режимом `{ kind: 'calc', exercise } | { kind: 'pick' } | null`, а не две отдельные.

### 6.3 `src/components/FavoriteStatCard/FavoriteStatCard.tsx`

```ts
interface Props { stat: FavoriteStat; colors: ThemeColors; onPress: () => void }
```

- Слева цветная полоса `exercise.color`, как в `ExerciseRow`. Дальше иконка типа и название.
- Справа крупно `best` с единицей: «100 кг» / «15 повт.». Для `assisted` — «помощь 10 кг». Если `best === null`, вместо значения «Нет данных».
- Ниже дельта:
  - `improved === true` → `colors.success`, `improved === false` → `colors.danger`, `diff === 0` → `colors.textSecondary` с текстом «без изменений к августу»;
  - формат: «+5 кг к августу», «−2.5 кг к июлю»;
  - знак берётся из `diff` (сырая разница). Для `assisted` получится «−5 кг» зелёным, и это правильно: помощь уменьшилась;
  - если `previous === null`, строка дельты не показывается.

### 6.4 `src/components/MonthlyBars/MonthlyBars.tsx`

```ts
interface Props { data: MonthCount[]; colors: ThemeColors; height?: number } // height по умолчанию 120
```

- `flexDirection: 'row'`, 12 колонок с `flex: 1` и `gap: 4`. Каждая колонка — число сверху, столбик, подпись месяца снизу.
- Высота столбика: `count / max * height`, при `count > 0` не меньше 2 px. При `max === 0` все столбики нулевые, а под графиком текст «Пока нет тренировок».
- Цвет: текущий месяц — `colors.accent`, остальные — `colors.accentMuted`.
- Подписи месяцев — `monthShortLabel`, `fontSize: 10`. На ширине 320 px 12 колонок помещаются.

---

## 7. Список файлов

| Файл | Что делаем |
|---|---|
| `src/db/init.ts` | колонка + миграция `is_favorite` |
| `src/types/exercise.ts` | `is_favorite: boolean` |
| `src/db/exercises.ts` | маппинг строк, `is_favorite` в SELECT/INSERT/UPDATE, `setExerciseFavorite` |
| `src/hooks/useExercises.ts` | `toggleFavorite` |
| `src/components/ExerciseRow/ExerciseRow.tsx` | звезда, `onToggleFavorite` |
| `src/components/ExerciseForm/ExerciseForm.tsx` | переключатель «Избранное» |
| `src/app/(tabs)/exercises.tsx` | проброс `onToggleFavorite` |
| `src/utils/exerciseTransfer.ts` | `favorite` в экспорте/импорте |
| `docs/formats/*` | описание поля `favorite`, схема, примеры |
| `src/utils/date.ts` | короткие и дательные названия месяцев, хелперы подписей |
| `src/utils/stats.ts` | **новый**: чистые функции статистики |
| `src/utils/calculator.ts` | **новый**: чистые функции калькулятора |
| `src/db/stats.ts` | **новый**: запросы для статистики и рабочего подхода |
| `src/hooks/useStats.ts` | **новый** |
| `src/hooks/useWorkoutDraft.ts` | `replaceSets`, экспорт `DEFAULT_SET` |
| `src/components/SetCalculator/SetCalculator.tsx` | **новый** |
| `src/components/FavoriteStatCard/FavoriteStatCard.tsx` | **новый** |
| `src/components/MonthlyBars/MonthlyBars.tsx` | **новый** |
| `src/components/SetsSheet/SetsSheet.tsx` | раскрывающийся калькулятор, «Применить» с подтверждением |
| `src/app/(tabs)/index.tsx` | проброс `onReplaceSets`, `excludeWorkoutId` |
| `src/app/(tabs)/_layout.tsx` | новый таб |
| `src/app/(tabs)/stats.tsx` | **новый** экран |

---

## 8. Порядок реализации

Каждый шаг можно проверить отдельно:

1. **Избранное:** миграция, тип, репозиторий, звезда в списке и форме. Проверка: звезда переключается и переживает перезапуск приложения.
2. **Экспорт/импорт `favorite`** и документация. Проверка: импорт старого примера без поля и нового файла с полем.
3. **`utils/stats.ts`, `db/stats.ts`, `useStats`**, таб с секцией «Избранное» и `MonthlyBars`.
4. **`utils/calculator.ts` и `SetCalculator`**, секция «Калькулятор» и шторка из карточки.
5. **`replaceSets`**, встраивание в `SetsSheet`, подтверждение замены.
6. `npx expo lint` и `npx tsc --noEmit`.

---

## 9. Граничные случаи

- Избранное упражнение без единой тренировки: карточка «Нет данных», без дельты. Калькулятор открывается с пустыми полями.
- Упражнение было только в одном месяце: дельты нет.
- У упражнения поменяли тип (например, `weighted` → `assisted`): старые подходы считаются по новому типу. Это осознанно, отдельной обработки нет.
- Удалили упражнение: `ON DELETE CASCADE` удалит его подходы, `bumpExercises` перерисует статистику.
- Тренировка 1-го числа в часовом поясе UTC+N попадает в правильный месяц (п. 1.1).
- Редактирование старой тренировки: калькулятор в `SetsSheet` не берёт её же подходы как рабочие (`excludeWorkoutId`).
- `weighted` с весом 0 в истории: `calculatePlan` вернёт `null`, UI попросит ввести вес.
- `assisted`, помощь 2.5 кг, цель «Сила»: помощь `max(0, …)` = 0 кг.

---

## 10. Тесты

**Тестового раннера в проекте нет** (в `devDependencies` нет jest или аналога). Добавить его — отдельное решение, без согласования не делаем. Если раннер появится, минимальный набор такой:

- `calculatePlan` для `weighted`: рабочий подход 100 кг × 5 даёт `e1RM ≈ 116.67`:
  - сила → **4 × 5 × 92.5** (94.59 → 92.5);
  - масса → **3 × 10 × 82.5** (83.33 → 82.5);
  - выносливость → **3 × 15 × 72.5** (74.47 → 72.5).
- `calculatePlan` для `bodyweight`, M = 12: сила 4 × 6, масса 3 × 8, выносливость 3 × 10.
- `calculatePlan` для `assisted`, a = 2.5, сила: помощь 0, не отрицательная.
- `exerciseProgress`: данные за июль и сентябрь, августа нет → `previous.month = '…-07'`. Для `assisted` при уменьшении помощи `improved = true`.
- `monthKey('2026-08-31T21:00:00.000Z')` при TZ=Europe/Moscow → `'2026-09'`. Запуск с `TZ=Europe/Moscow` в env.
- `parseExercises`: файл без `favorite` парсится, все `is_favorite === false`.

Без раннера эти же кейсы можно руками проверить в приложении на тестовых данных из `docs/formats/examples/`.

---

## 11. Не входит в задачу

- Линейные графики, библиотеки графиков, `react-native-svg`.
- Настраиваемый шаг веса, переключатель периода, редактируемые схемы целей.
- Хранение ручного рабочего показателя.
- Удаление мёртвого `useHistory` / `WorkoutsVersionContext` (если делать — отдельным коммитом).
