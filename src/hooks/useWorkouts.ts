import { useWorkoutData, useWorkoutWrites } from './useDataQueries';
export function useWorkouts(){const query=useWorkoutData();const writes=useWorkoutWrites();return {workouts:query.data??[],loading:query.isPending,error:query.error?.message??null,remove:writes.remove,reload:query.refetch};}
