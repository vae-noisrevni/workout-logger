import {bodyWeightService} from '@/services/data';
import {keys,useBodyWeightData,useWrite} from './useDataQueries';
export function useBodyWeight(){const query=useBodyWeightData();const save=useWrite(bodyWeightService.save,[keys.bodyWeight]);const remove=useWrite(bodyWeightService.remove,[keys.bodyWeight]);return {entries:query.data??[],error:query.error?.message??null,save:save.mutateAsync,remove:remove.mutateAsync,pending:save.isPending||remove.isPending};}
