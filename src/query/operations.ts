import type {QueryClient} from '@tanstack/react-query';
export function writeOptions<T,R>(client:QueryClient,operation:(input:T)=>Promise<R>,families:readonly (readonly string[])[]){
    return {mutationFn:operation,onSuccess:async()=>{
        await Promise.all(families.map(queryKey=>client.invalidateQueries({queryKey})));
    }};
}
