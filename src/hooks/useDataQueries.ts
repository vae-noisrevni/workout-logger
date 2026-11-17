import {writeOptions} from '@/query/operations';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exerciseService, workoutService, presetService, bodyWeightService } from '@/services/data';

export const keys={exercises:['exercises'] as const,workouts:['workouts'] as const,presets:['presets'] as const,bodyWeight:['bodyWeight'] as const};
export function useWrite<T,R>(operation:(input:T)=>Promise<R>,families:readonly (readonly string[])[]){
    const client=useQueryClient();
    return useMutation(writeOptions(client,operation,families));
}
export function useExerciseData(){return useQuery({queryKey:keys.exercises,queryFn:async({signal})=>{const data=await exerciseService.list();signal.throwIfAborted();return data;}});}
export function useWorkoutData(){return useQuery({queryKey:keys.workouts,queryFn:async({signal})=>{const data=await workoutService.list();signal.throwIfAborted();return data;}});}
export function usePresetData(){return useQuery({queryKey:keys.presets,queryFn:async({signal})=>{const data=await presetService.list();signal.throwIfAborted();return data;}});}
export function useBodyWeightData(){return useQuery({queryKey:keys.bodyWeight,queryFn:async({signal})=>{const data=await bodyWeightService.list();signal.throwIfAborted();return data;}});}
export function useLastResult(exerciseId:number|undefined,excludeId?:number){
    const {data=[]}=useWorkoutData();
    const workout=data.find((item)=>item.id!==excludeId&&item.exercises.some((e)=>e.exercise_id===exerciseId&&e.sets.length));
    const exercise=workout?.exercises.find((e)=>e.exercise_id===exerciseId);
    return workout&&exercise?{date:workout.date,sets:exercise.sets,comment:exercise.comment}:null;
}
export function useWorkoutWrites(){
    const save=useWrite(workoutService.save,[keys.workouts]);
    const remove=useWrite(workoutService.remove,[keys.workouts]);
    const importData=useWrite(workoutService.import,[keys.workouts]);
    return {save:save.mutateAsync,remove:remove.mutate,importData:importData.mutateAsync,pending:save.isPending||remove.isPending||importData.isPending};
}
