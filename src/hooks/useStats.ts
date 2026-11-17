import {useMemo} from 'react';
import {useExercises} from './useExercises';
import {useWorkouts} from './useWorkouts';
import {useLocalDate} from './useLocalDate';
import {exerciseProgress,workoutsPerMonth} from '@/utils/stats';
export function useStats(){
    const {allExercises,error:exerciseError}=useExercises();
    const {workouts,error:workoutError}=useWorkouts();
    const date=useLocalDate();
    return useMemo(()=>{
        const favorites=allExercises.filter(e=>e.is_favorite).map(exercise=>{
            const rows=workouts.flatMap(workout=>workout.exercises.filter(entry=>entry.exercise_id===exercise.id)
                .flatMap(entry=>entry.sets.map(set=>({...set,date:workout.date,workout_id:workout.id,exercise_id:entry.exercise_id}))));
            return {exercise,progress:exerciseProgress(exercise.type,rows)};
        });
        return {favorites,monthly:workoutsPerMonth(workouts.map(w=>w.date),new Date(`${date}T12:00:00`)),error:exerciseError??workoutError};
    },[allExercises,workouts,date,exerciseError,workoutError]);
}
