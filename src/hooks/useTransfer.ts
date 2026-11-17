import {useMutation,useQueryClient} from '@tanstack/react-query';
import {transferService} from '@/services/transfer';
import {keys} from './useDataQueries';
export function useTransfer(){
    const client=useQueryClient();
    const imports=useMutation({mutationFn:transferService.importPresets,onSuccess:async()=>{await Promise.all([keys.exercises,keys.presets].map(queryKey=>client.invalidateQueries({queryKey})));}});
    const restore=useMutation({mutationKey:['restore'],mutationFn:async(source:string)=>{await client.cancelQueries();await transferService.restore(source);},
        onSuccess:async()=>{await client.resetQueries();}});
    const exportData=useMutation({mutationFn:transferService.export});
    return {importPresets:imports.mutateAsync,restore:restore.mutateAsync,exportData:exportData.mutateAsync,pending:imports.isPending||restore.isPending||exportData.isPending};
}
