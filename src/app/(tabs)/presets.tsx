import {TransferControls} from '@/components/TransferControls/TransferControls';
import {useState} from 'react';
import {Text,View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {useTheme} from '@/theme/ThemeContext';
import {usePresets} from '@/hooks/usePresets';
import {useExercises} from '@/hooks/useExercises';
import {Action,Heading,Panel} from '@/components/ScreenControls/ScreenControls';
import {PresetEditor} from '@/components/PresetEditor/PresetEditor';
import {ThemeSheet} from '@/components/ThemeSheet/ThemeSheet';
import {SwipeToDelete} from '@/components/SwipeToDelete/SwipeToDelete';
import {useDialog} from '@/components/ConfirmDialog/DialogProvider';
import type {WorkoutPreset} from '@/types/presets';
export default function PresetsScreen(){
    const colors=useTheme();const dialog=useDialog();const {presets,error,remove,pending}=usePresets();const {allExercises}=useExercises();
    const [choosing,setChoosing]=useState(false);
    const [editor,setEditor]=useState<{preset?:WorkoutPreset}|null>(null);
    return <View style={{flex:1,backgroundColor:colors.background}}>
        <ScrollView contentContainerStyle={{padding:16,gap:12}}>
            <View style={{flexDirection:'row',gap:8}}>
                <Action title="Создать пресет" grow selected disabled={pending} onPress={()=>setEditor({})}/>
                <Action title="Редактировать" grow disabled={pending||!presets.length} onPress={()=>setChoosing(true)}/>
            </View>
            <TransferControls mode="presets"/>
            {error&&<Text style={{color:colors.danger}}>{error}</Text>}
            {!presets.length&&<Text style={{color:colors.textSecondary}}>Пока нет пресетов</Text>}
            {presets.map(preset=><SwipeToDelete key={preset.id} radius={16} onDelete={()=>{if(pending)return;dialog.show({title:'Удалить пресет?',message:'Сохранённые тренировки останутся в истории.',buttons:[{text:'Отмена',style:'cancel'},{text:'Удалить',style:'destructive',onPress:()=>remove(preset.id)}]});}}>
                <Panel>
                    <Heading>{preset.name}</Heading>
                    <Text style={{color:colors.textSecondary}}>{preset.exercise_ids.map(id=>allExercises.find(e=>e.id===id)?.name).filter(Boolean).join(' · ')||'Добавьте упражнения'}</Text>
                </Panel>
            </SwipeToDelete>)}
        </ScrollView>
        {(choosing||editor)&&<ThemeSheet onClose={()=>{setChoosing(false);setEditor(null);}}>
            {editor ? <PresetEditor preset={editor.preset} onSaved={()=>setEditor(null)} onCancel={()=>setEditor(null)}/>
                : <>
                    <Heading>Какой пресет редактировать?</Heading>
                    {presets.map(preset=><Action key={preset.id} title={preset.name} onPress={()=>{
                        setChoosing(false);
                        setEditor({preset});
                    }}/>)}
                </>}
        </ThemeSheet>}
    </View>;
}
