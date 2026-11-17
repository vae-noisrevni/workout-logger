import { databaseApi } from '@/db/api';
import type { Exercise, CreateExerciseInput, UpdateExerciseInput } from '@/types/exercise';
import type { Workout, CreateWorkoutInput, ImportedWorkout, WorkoutExercise, WorkoutSet } from '@/types/workouts';
import type { WorkoutPreset } from '@/types/presets';
import type { BodyWeightEntry } from '@/types/bodyWeight';
import type { SQLiteDatabase } from 'expo-sqlite';
import { resolveDate, dateKey } from '@/utils/date';

type ExerciseRow = Omit<Exercise, 'is_favorite'> & { is_favorite: number };
export const toExercise = (row: ExerciseRow): Exercise => ({ ...row, is_favorite: row.is_favorite === 1 });
export async function readExercises(db?: SQLiteDatabase): Promise<Exercise[]> {
    const sql = 'SELECT id, name, type, description, color, is_favorite, weight_unit FROM exercises ORDER BY name';
    return (db ? await db.getAllAsync<ExerciseRow>(sql) : await databaseApi.all<ExerciseRow>(sql)).map(toExercise);
}
export async function insertExercise(db: SQLiteDatabase, input: CreateExerciseInput) {
    return (await db.runAsync('INSERT INTO exercises (name,type,description,color,is_favorite,weight_unit) VALUES (?,?,?,?,?,?)',
        [input.name.trim(), input.type, input.description, input.color, Number(input.is_favorite), input.weight_unit ?? 'kg'])).lastInsertRowId;
}
export const exerciseDb = {
    list: () => readExercises(),
    create: (input: CreateExerciseInput) => databaseApi.transaction((db) => insertExercise(db, input)),
    update: (input: UpdateExerciseInput) => databaseApi.transaction(async (db) => {
        const current = (await readExercises(db)).find((item) => item.id === input.id);
        if (!current) throw new Error('Упражнение не найдено');
        const next = { ...current, ...input };
        await db.runAsync('UPDATE exercises SET name=?,type=?,description=?,color=?,is_favorite=?,weight_unit=? WHERE id=?',
            [next.name.trim(), next.type, next.description, next.color, Number(next.is_favorite), next.weight_unit, input.id]);
    }),
    remove: (id: number) => databaseApi.transaction(async (db) => { await db.runAsync('DELETE FROM exercises WHERE id=?', [id]); }),
    import: (items: CreateExerciseInput[]) => databaseApi.transaction(async (db) => { for (const item of items) await insertExercise(db, item); return items.length; }),
};
export async function readWorkouts(db?: SQLiteDatabase): Promise<Workout[]> {
    const all = <T>(sql: string) => db ? db.getAllAsync<T>(sql) : databaseApi.all<T>(sql);
    const workouts = await all<Omit<Workout, 'exercises'>>('SELECT id,name,date,comment,preset_id,preset_name FROM workouts');
    const entries = await all<Omit<WorkoutExercise, 'sets'>>(`SELECT we.id,we.workout_id,we.exercise_id,we.comment,we.sort_order,e.name,e.type,e.color
        FROM workout_exercises we JOIN exercises e ON e.id=we.exercise_id ORDER BY we.sort_order`);
    const sets = await all<WorkoutSet & { workout_exercise_id: number }>('SELECT id,workout_exercise_id,reps,weight FROM workout_sets ORDER BY sort_order');
    const setsByEntry = new Map<number, WorkoutSet[]>();
    for (const set of sets) { const group = setsByEntry.get(set.workout_exercise_id) ?? []; group.push(set); setsByEntry.set(set.workout_exercise_id, group); }
    const entriesByWorkout = new Map<number, WorkoutExercise[]>();
    for (const entry of entries) { const group = entriesByWorkout.get(entry.workout_id) ?? []; group.push({ ...entry, sets: setsByEntry.get(entry.id) ?? [] }); entriesByWorkout.set(entry.workout_id, group); }
    return workouts.map((workout) => ({ ...workout, exercises: entriesByWorkout.get(workout.id) ?? [] }))
        .sort((a,b) => (resolveDate(b.date)?.getTime() ?? 0) - (resolveDate(a.date)?.getTime() ?? 0) || b.id-a.id);
}
export async function insertWorkout(db: SQLiteDatabase, input: CreateWorkoutInput, id?: number) {
    const date = resolveDate(input.date);
    if (!date) throw new Error(`Неверная дата тренировки: ${input.date}`);
    let workoutId = id;
    if (workoutId === undefined) workoutId = (await db.runAsync('INSERT INTO workouts(name,date,comment,preset_id,preset_name) VALUES(?,?,?,?,?)',
        [input.name,input.date,input.comment,input.preset_id ?? null,input.preset_name ?? null])).lastInsertRowId;
    else {
        await db.runAsync('UPDATE workouts SET name=?,date=?,comment=?,preset_id=?,preset_name=? WHERE id=?',
            [input.name,input.date,input.comment,input.preset_id ?? null,input.preset_name ?? null,workoutId]);
        await db.runAsync('DELETE FROM workout_exercises WHERE workout_id=?',[workoutId]);
    }
    for (const [order,exercise] of input.exercises.entries()) {
        const entryId=(await db.runAsync('INSERT INTO workout_exercises(workout_id,exercise_id,sort_order,comment) VALUES(?,?,?,?)',
            [workoutId,exercise.exercise_id,order,exercise.comment ?? ''])).lastInsertRowId;
        for (const [setOrder,set] of exercise.sets.entries()) await db.runAsync('INSERT INTO workout_sets(workout_exercise_id,reps,weight,sort_order) VALUES(?,?,?,?)', [entryId,set.reps,set.weight,setOrder]);
    }
    return workoutId;
}
export const workoutDb = {
    list: () => databaseApi.transaction(db => readWorkouts(db)),
    save: ({ input, id }: { input: CreateWorkoutInput; id?: number }) => databaseApi.transaction((db) => insertWorkout(db,input,id)),
    remove: (id: number) => databaseApi.transaction(async (db) => { await db.runAsync('DELETE FROM workouts WHERE id=?',[id]); }),
    import: (items: ImportedWorkout[]) => databaseApi.transaction(async (db) => {
        const exercises=await readExercises(db);
        const existing=new Set((await readWorkouts(db)).map((w)=>`${dateKey(w.date)}|${w.name.trim().toLowerCase()}`));
        let added=0, skipped=0;
        for(const item of items){
            const key=`${dateKey(item.date)}|${item.name.trim().toLowerCase()}`;
            if(existing.has(key)){skipped++;continue;}
            const mapped=item.exercises.map((exercise)=>{
                const found=exercises.find((e)=>e.name.trim().toLowerCase()===exercise.name.trim().toLowerCase());
                if(!found) throw new Error(`В справочнике нет упражнения: ${exercise.name}`);
                return {...exercise,exercise_id:found.id};
            });
            await insertWorkout(db,{...item,exercises:mapped}); existing.add(key); added++;
        }
        return {added,skipped};
    }),
};
export async function readPresets(db?: SQLiteDatabase, archived = false): Promise<WorkoutPreset[]> {
    const all=<T>(sql:string)=>db ? db.getAllAsync<T>(sql) : databaseApi.all<T>(sql);
    const presets=await all<{id:number;name:string;archived:number}>(`SELECT id,name,archived FROM workout_presets ${archived?'':'WHERE archived=0'} ORDER BY id`);
    const links=await all<{preset_id:number;exercise_id:number}>('SELECT preset_id,exercise_id FROM workout_preset_exercises ORDER BY sort_order');
    const sets=await all<{preset_id:number;exercise_id:number;reps:number;weight:number}>('SELECT preset_id,exercise_id,reps,weight FROM preset_sets ORDER BY sort_order');
    return presets.map((preset)=>({...preset,exercise_ids:links.filter((l)=>l.preset_id===preset.id).map((l)=>l.exercise_id),
        exercises:links.filter((l)=>l.preset_id===preset.id).map((l)=>({exercise_id:l.exercise_id,sets:sets.filter((s)=>s.preset_id===preset.id&&s.exercise_id===l.exercise_id).map(({reps,weight})=>({reps,weight}))}))}));
}
export async function insertPreset(db:SQLiteDatabase,input:Pick<WorkoutPreset,'name'|'exercises'>,id?:number,archived=0){
    if(!input.name.trim()||!input.exercises.length) throw new Error('Укажите название и упражнения пресета');
    if(new Set(input.exercises.map((e)=>e.exercise_id)).size!==input.exercises.length) throw new Error('Упражнение повторяется в пресете');
    let presetId=id;
    if(presetId===undefined) presetId=(await db.runAsync('INSERT INTO workout_presets(name,archived) VALUES(?,?)',[input.name.trim(),archived])).lastInsertRowId;
    else {await db.runAsync('UPDATE workout_presets SET name=? WHERE id=?',[input.name.trim(),presetId]);await db.runAsync('DELETE FROM workout_preset_exercises WHERE preset_id=?',[presetId]);}
    for(const [order,exercise] of input.exercises.entries()){
        await db.runAsync('INSERT INTO workout_preset_exercises(preset_id,exercise_id,sort_order) VALUES(?,?,?)',[presetId,exercise.exercise_id,order]);
        for(const [setOrder,set] of exercise.sets.entries()){
            if(!Number.isInteger(set.reps)||set.reps<1||!Number.isFinite(set.weight)||set.weight<0) throw new Error('Неверные значения подхода пресета');
            await db.runAsync('INSERT INTO preset_sets(preset_id,exercise_id,reps,weight,sort_order) VALUES(?,?,?,?,?)',[presetId,exercise.exercise_id,set.reps,set.weight,setOrder]);
        }
    }
    return presetId;
}
export const presetDb={list:()=>databaseApi.transaction(db=>readPresets(db)),save:(input:Pick<WorkoutPreset,'name'|'exercises'>&{id?:number})=>databaseApi.transaction((db)=>insertPreset(db,input,input.id)),
    remove:(id:number)=>databaseApi.transaction(async(db)=>{await db.runAsync('UPDATE workout_presets SET archived=1 WHERE id=?',[id]);})};
export const bodyWeightDb={
    list:async()=> (await databaseApi.all<BodyWeightEntry>('SELECT id,date,weight_kg FROM body_weight_entries')).sort((a,b)=>dateKey(b.date).localeCompare(dateKey(a.date))),
    save:({date,weight,id}:{date:string;weight:number;id?:number})=>databaseApi.transaction(async(db)=>{
        const key=dateKey(date);
        if(!key||key>dateKey(new Date().toISOString())||!Number.isFinite(weight)||weight<=0) throw new Error('Укажите корректную дату не позже сегодняшней и положительный вес');
        if(id!==undefined) await db.runAsync('UPDATE body_weight_entries SET date=?,weight_kg=? WHERE id=?',[key,weight,id]);
        else await db.runAsync('INSERT INTO body_weight_entries(date,weight_kg) VALUES(?,?)',[key,weight]);
    }),remove:(id:number)=>databaseApi.transaction(async(db)=>{await db.runAsync('DELETE FROM body_weight_entries WHERE id=?',[id]);})};
