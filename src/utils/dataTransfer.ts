import type {Exercise} from '@/types/exercise';
import type {WorkoutPreset} from '@/types/presets';
import type {CreateWorkoutInput} from '@/types/workouts';
import type {BodyWeightEntry} from '@/types/bodyWeight';
import {dateKey,resolveDate} from './date';
import {parseExercises} from './exerciseTransfer';

export interface BackupWorkout extends CreateWorkoutInput {id:number}
export interface DataFile {kind:'workout-logger-backup'|'workout-logger-presets';version:1;exportedAt:string;exercises:Exercise[];presets:WorkoutPreset[];workouts:BackupWorkout[];bodyWeight:BodyWeightEntry[]}
const fail=(where:string):never=>{throw new Error(`Неверные данные: ${where}`);};
const object=(value:unknown,where:string):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:fail(where);
const array=(value:unknown,where:string):unknown[]=>Array.isArray(value)?value:fail(where);
const text=(value:unknown,where:string)=>typeof value==='string'?value:fail(where);
const id=(value:unknown,where:string):number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>0?value:fail(where);
const finite=(value:unknown,where:string):number=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:fail(where);
const unique=(values:number[],where:string)=>{if(new Set(values).size!==values.length)fail(`повторяющийся ID ${where}`);};
export function parseDataFile(source:string,kind:DataFile['kind']):DataFile{
    let raw:unknown;try{raw=JSON.parse(source.replace(/^\uFEFF/,''));}catch{throw new Error('Файл не является JSON');}
    const root=object(raw,'корень файла');
    if(root.kind!==kind||root.version!==1)throw new Error('Неподдерживаемый вид или версия файла');
    const exportedAt=text(root.exportedAt,'дата экспорта');if(!resolveDate(exportedAt))fail('дата экспорта');
    const rawExercises=array(root.exercises,'упражнения');
    const exercises=rawExercises.map((item,index)=>{
        const e=object(item,`упражнение ${index+1}`);
        if(typeof e.is_favorite!=='boolean')fail(`избранное упражнения ${index+1}`);
        const parsed=parseExercises(JSON.stringify([{...e,favorite:e.is_favorite}]),'json')[0];
        return {...parsed,id:id(e.id,`ID упражнения ${index+1}`),weight_unit:parsed.weight_unit??'kg'};
    });unique(exercises.map(e=>e.id),'упражнений');
    const exerciseIds=new Set(exercises.map(e=>e.id));
    const readPlan=(value:unknown,where:string)=>array(value,where).map((item,index)=>{
        const entry=object(item,`${where}, упражнение ${index+1}`);const exercise_id=id(entry.exercise_id,where);
        if(!exerciseIds.has(exercise_id))fail(`${where}: нет упражнения ${exercise_id}`);
        const sets=array(entry.sets,`${where}: подходы`).map((value,setIndex)=>{
            const set=object(value,`${where}, подход ${setIndex+1}`);const reps=finite(set.reps,where),weight=finite(set.weight,where);
            if(!Number.isInteger(reps)||reps<1)fail(`${where}, подход ${setIndex+1}: повторы`);
            return {reps,weight};
        });
        return {exercise_id,sets,comment:entry.comment===undefined?'':text(entry.comment,`${where}: комментарий`)};
    });
    const presets=array(root.presets,'пресеты').map((item,index)=>{
        const p=object(item,`пресет ${index+1}`);const name=text(p.name,`название пресета ${index+1}`);if(!name.trim())fail('пустое название пресета');
        const plan=readPlan(p.exercises,`пресет ${name}`);unique(plan.map(e=>e.exercise_id),`упражнений пресета ${name}`);
        const archived=p.archived??0;if(archived!==0&&archived!==1)fail(`архив пресета ${name}`);
        return {id:id(p.id,'ID пресета'),name,archived:Number(archived),exercises:plan,exercise_ids:plan.map(e=>e.exercise_id)};
    });unique(presets.map(p=>p.id),'пресетов');
    if(kind==='workout-logger-presets'){
        if(!presets.length||presets.some(p=>!p.exercises.length||p.archived))fail('перенос пресетов: нужен непустой активный пресет');
        return {kind,version:1,exportedAt,exercises,presets,workouts:[],bodyWeight:[]};
    }
    const presetIds=new Set(presets.map(p=>p.id));
    const workouts=array(root.workouts,'тренировки').map((item,index)=>{
        const w=object(item,`тренировка ${index+1}`);const date=text(w.date,'дата тренировки');const resolved=resolveDate(date);
        if(!resolved)fail(`тренировка ${index+1}: дата «${date}»`);
        const preset_id=w.preset_id==null?null:id(w.preset_id,'ID пресета тренировки');
        if(preset_id!==null&&!presetIds.has(preset_id))fail(`тренировка ${index+1}: неизвестный пресет`);
        const plan=readPlan(w.exercises,`тренировка ${index+1}`);unique(plan.map(e=>e.exercise_id),`упражнений тренировки ${index+1}`);
        const name=text(w.name,'название тренировки');if(!name.trim())fail('пустое название тренировки');
        return {id:id(w.id,'ID тренировки'),name,date:resolved!.toISOString(),comment:text(w.comment,'комментарий тренировки'),preset_id,
            preset_name:w.preset_name==null?null:text(w.preset_name,'снимок названия пресета'),exercises:plan};
    });unique(workouts.map(w=>w.id),'тренировок');
    const bodyWeight=array(root.bodyWeight,'замеры').map((item,index)=>{
        const entry=object(item,`замер ${index+1}`);const rawDate=text(entry.date,'дата замера');const date=dateKey(rawDate);
        if(!date||date>dateKey(new Date().toISOString()))fail(`замер ${index+1}: дата «${rawDate}»`);
        const weight_kg=finite(entry.weight_kg,'вес тела');if(weight_kg===0)fail('нулевой вес тела');
        return {id:id(entry.id,'ID замера'),date,weight_kg};
    });unique(bodyWeight.map(e=>e.id),'замеров');if(new Set(bodyWeight.map(e=>e.date)).size!==bodyWeight.length)fail('несколько замеров на одну дату');
    return {kind,version:1,exportedAt,exercises,presets,workouts,bodyWeight};
}
export const serializeDataFile=(file:DataFile)=>JSON.stringify(file,null,2);
