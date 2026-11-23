import {databaseApi} from '@/db/api';
import {readExercises,readWorkouts,readPresets,insertExercise,insertPreset,insertWorkout} from '@/db/domain';
import {parseDataFile,serializeDataFile,type DataFile} from '@/utils/dataTransfer';
import type {BodyWeightEntry} from '@/types/bodyWeight';
const normalize=(name:string)=>name.trim().toLowerCase();
export const transferService={
    export: async (kind:DataFile['kind'])=>{
        const file = await databaseApi.transaction(async(db):Promise<DataFile>=>{
            const presets=await readPresets(db,kind==='workout-logger-backup');
            const used=new Set(presets.flatMap(p=>p.exercise_ids));
            const exercises=(await readExercises(db)).filter(e=>kind==='workout-logger-backup'||used.has(e.id));
            const workouts=kind==='workout-logger-backup'?(await readWorkouts(db)).map(w=>({...w,exercises:w.exercises.map(e=>({exercise_id:e.exercise_id,comment:e.comment,sets:e.sets.map(({reps,weight})=>({reps,weight}))}))})):[];
            const bodyWeight=kind==='workout-logger-backup'?await db.getAllAsync<BodyWeightEntry>('SELECT id,date,weight_kg FROM body_weight_entries ORDER BY date DESC'):[];
            return {kind,version:1,exportedAt:new Date().toISOString(),exercises,presets,workouts,bodyWeight};
        });
        if (kind === 'workout-logger-presets') parseDataFile(serializeDataFile(file), kind);
        return file;
    },
    importPresets:(source:string)=>{
        const file=parseDataFile(source,'workout-logger-presets');
        return databaseApi.transaction(async(db)=>{
            const currentExercises=await readExercises(db),currentPresets=await readPresets(db);
            const mapping=new Map<number,number>();
            for(const exercise of file.exercises){
                const name=normalize(exercise.name);
                const found=currentExercises.filter(e=>normalize(e.name)===name);
                if(found.length>1||found.some(e=>e.type!==exercise.type))throw new Error(`Неоднозначное упражнение: ${exercise.name}`);
                if(found.length)mapping.set(exercise.id,found[0].id);
            }
            let skipped=0;const pending:typeof file.presets=[];
            for(const preset of file.presets){
                const name=normalize(preset.name);
                const found=currentPresets.filter(p=>normalize(p.name)===name);
                const plan=preset.exercises.map(e=>({exercise_id:mapping.get(e.exercise_id)??-e.exercise_id,sets:e.sets}));
                if(found.length>1)throw new Error(`Неоднозначный пресет: ${preset.name}`);
                if(found.length){
                    if(JSON.stringify(found[0].exercises)!==JSON.stringify(plan))throw new Error(`Пресет «${preset.name}» уже есть с другим планом`);
                    skipped++;
                }else pending.push(preset);
            }
            for(const exercise of file.exercises)if(!mapping.has(exercise.id))mapping.set(exercise.id,await insertExercise(db,exercise));
            for(const preset of pending)await insertPreset(db,{name:preset.name,exercises:preset.exercises.map(e=>({...e,exercise_id:mapping.get(e.exercise_id)!}))});
            return {added:pending.length,skipped};
        });
    },
    restore:(source:string)=>{
        const file=parseDataFile(source,'workout-logger-backup');
        return databaseApi.restore(async(db)=>{
            await db.execAsync('DELETE FROM workout_sets; DELETE FROM workout_exercises; DELETE FROM workouts; DELETE FROM preset_sets; DELETE FROM workout_preset_exercises; DELETE FROM workout_presets; DELETE FROM exercises; DELETE FROM body_weight_entries;');
            for(const exercise of file.exercises)await db.runAsync('INSERT INTO exercises(id,name,type,description,color,is_favorite,weight_unit) VALUES(?,?,?,?,?,?,?)',
                [exercise.id,exercise.name,exercise.type,exercise.description,exercise.color,Number(exercise.is_favorite),exercise.weight_unit]);
            for(const preset of file.presets){
                await db.runAsync('INSERT INTO workout_presets(id,name,archived) VALUES(?,?,?)',[preset.id,preset.name,preset.archived??0]);
                if(preset.exercises.length)await insertPreset(db,preset,preset.id);
            }
            for(const workout of file.workouts){
                await db.runAsync('INSERT INTO workouts(id,name,date,comment,preset_id,preset_name) VALUES(?,?,?,?,?,?)',[workout.id,workout.name,workout.date,workout.comment,workout.preset_id??null,workout.preset_name??null]);
                await insertWorkout(db,workout,workout.id);
            }
            for(const entry of file.bodyWeight)await db.runAsync('INSERT INTO body_weight_entries(id,date,weight_kg) VALUES(?,?,?)',[entry.id,entry.date,entry.weight_kg]);
        });
    },
};
