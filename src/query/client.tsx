import { useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { QueryClient, QueryClientProvider, MutationCache, focusManager } from '@tanstack/react-query';
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';

export function DataQueryProvider({children}:{children:ReactNode}){
    const dialog=useDialog();
    const [client]=useState(()=>new QueryClient({
        defaultOptions:{queries:{networkMode:'always',retry:false,staleTime:30000},mutations:{networkMode:'always',retry:false}},
        mutationCache:new MutationCache({onError:(error)=>dialog.show({title:'Ошибка',message:error.message})}),
    }));
    useEffect(()=>{
        const subscription=AppState.addEventListener('change',(state)=>focusManager.setFocused(state==='active'));
        return ()=>subscription.remove();
    },[]);
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
