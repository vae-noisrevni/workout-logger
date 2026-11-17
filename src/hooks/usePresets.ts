import { presetService } from '@/services/data';
import { keys,usePresetData,useWrite } from './useDataQueries';
export function usePresets(){const query=usePresetData();const save=useWrite(presetService.save,[keys.presets]);const remove=useWrite(presetService.remove,[keys.presets]);return {presets:query.data??[],loading:query.isPending,error:query.error?.message??null,save:save.mutateAsync,remove:remove.mutate,pending:save.isPending||remove.isPending};}
