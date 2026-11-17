import { useState } from 'react';
import { exerciseService } from '@/services/data';
import { keys, useExerciseData, useWrite } from './useDataQueries';
import type { Exercise } from '@/types/exercise';
export function useExercises(){
    const [search,setSearch]=useState('');const query=useExerciseData();
    const related=[keys.exercises,keys.presets,keys.workouts];
    const create=useWrite(exerciseService.create,related);const update=useWrite(exerciseService.update,related);
    const remove=useWrite(exerciseService.remove,related);const imports=useWrite(exerciseService.import,related);
    const allExercises=query.data??[];
    return {allExercises,exercises:allExercises.filter((e)=>e.name.toLowerCase().includes(search.trim().toLowerCase())),
        search,setSearch,loading:query.isPending,error:query.error?.message??null,pending:create.isPending||update.isPending||remove.isPending||imports.isPending,
        create:create.mutateAsync,update:update.mutateAsync,remove:remove.mutate,importData:imports.mutateAsync,
        toggleFavorite:(e:Exercise)=>update.mutate({id:e.id,is_favorite:!e.is_favorite})};
}
