import {useEffect,useRef} from 'react';
import {Text,View} from 'react-native';
import {useQueryClient} from '@tanstack/react-query';
import {useTransfer} from '@/hooks/useTransfer';
import {useWorkoutDraftContext} from '@/context/WorkoutDraftContext';
import {useDialog} from '@/components/ConfirmDialog/DialogProvider';
import {Action} from '@/components/ScreenControls/ScreenControls';
import {pickTextFile,shareTextFile} from '@/utils/fileTransfer';
import {parseDataFile,serializeDataFile} from '@/utils/dataTransfer';
import {useTheme} from '@/theme/ThemeContext';
export function TransferControls({mode}:{mode:'presets'|'all'}){
    const transfer=useTransfer(),dialog=useDialog(),draft=useWorkoutDraftContext(),colors=useTheme();const client=useQueryClient();
    const latestDraft=useRef(draft);useEffect(()=>{latestDraft.current=draft;},[draft]);
    const kind=mode==='all'?'workout-logger-backup':'workout-logger-presets';
    const report=(error:unknown)=>dialog.show({title:'Ошибка переноса',message:error instanceof Error?error.message:'Не удалось выполнить перенос'});
    const exportFile=async()=>{try{const data=await transfer.exportData(kind);await shareTextFile(`${kind}-${new Date().toISOString().slice(0,10)}.json`,serializeDataFile(data),'json','Экспорт данных');}catch(error){report(error);}};
    const importFile=async()=>{
        if(mode==='all'&&(!draft.hydrated||draft.draft.length||draft.editing)){dialog.show({title:'Есть текущая тренировка',message:'Завершите тренировку или явно очистите черновик перед восстановлением.'});return;}
        try{
            const picked=await pickTextFile();if(!picked)return;
            const file=parseDataFile(picked.text,kind);
            if(mode==='presets'){const result=await transfer.importPresets(picked.text);dialog.show({title:'Импорт завершён',message:`Добавлено: ${result.added}, пропущено: ${result.skipped}`});return;}
            dialog.show({title:'Заменить все сохранённые данные?',message:`В файле: ${file.exercises.length} упражнений, ${file.workouts.length} тренировок, ${file.presets.length} пресетов и ${file.bodyWeight.length} замеров. Текущие сохранённые данные будут заменены.`,buttons:[{text:'Отмена',style:'cancel'},
                {text:'Восстановить',style:'destructive',onPress:async()=>{
                    if(latestDraft.current.draft.length||latestDraft.current.editing||!latestDraft.current.hydrated||client.isMutating()){dialog.show({title:'Восстановление недоступно',message:'Завершите текущую работу и дождитесь сохранения данных.'});return;}
                    try{await transfer.restore(picked.text);dialog.show({title:'Готово',message:'Сохранённые данные восстановлены'});}catch(error){report(error);}
                }}]});
        }catch(error){report(error);}
    };
    return <View style={{gap:8}}><Action title={mode==='all'?'Экспорт всех данных':'Экспорт пресетов'} disabled={transfer.pending} onPress={exportFile}/>
        <Action title={mode==='all'?'Восстановить все данные':'Импорт пресетов'} disabled={transfer.pending} onPress={importFile}/>
        {transfer.pending&&<Text style={{color:colors.textSecondary}}>Обработка данных…</Text>}
    </View>;
}
