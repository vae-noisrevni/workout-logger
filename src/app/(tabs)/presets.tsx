import {TransferControls} from '@/components/TransferControls/TransferControls';
import {useState} from 'react';
import {Text,View,Pressable} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/theme/ThemeContext';
import {usePresets} from '@/hooks/usePresets';
import {useExercises} from '@/hooks/useExercises';
import {Heading,Panel} from '@/components/ScreenControls/ScreenControls';
import {PresetEditor} from '@/components/PresetEditor/PresetEditor';
import {ThemeSheet} from '@/components/ThemeSheet/ThemeSheet';
import {SwipeToDelete} from '@/components/SwipeToDelete/SwipeToDelete';
import {useDialog} from '@/components/ConfirmDialog/DialogProvider';
import type {WorkoutPreset} from '@/types/presets';
export default function PresetsScreen(){
    const colors=useTheme();const dialog=useDialog();const {presets,error,remove,pending}=usePresets();const {allExercises}=useExercises();
    const [editor,setEditor]=useState<{preset?:WorkoutPreset}|null>(null);
    return <View style={{flex:1,backgroundColor:colors.background}}>
        <ScrollView contentContainerStyle={{padding:16,paddingBottom:100,gap:12}}>
            <TransferControls mode="presets"/>
            {error&&<Text style={{color:colors.danger}}>{error}</Text>}
            {!presets.length&&<Text style={{color:colors.textSecondary}}>Создайте пресет кнопкой +</Text>}
            {presets.map(preset=><SwipeToDelete key={preset.id} radius={16} onDelete={()=>{if(pending)return;dialog.show({title:'Удалить пресет?',message:'Сохранённые тренировки останутся в истории.',buttons:[{text:'Отмена',style:'cancel'},{text:'Удалить',style:'destructive',onPress:()=>remove(preset.id)}]});}}>
                <Panel><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1}}><Heading>{preset.name}</Heading></View>
                    <Pressable accessibilityLabel={`Редактировать ${preset.name}`} disabled={pending} onPress={()=>setEditor({preset})} style={{padding:12,borderRadius:10,backgroundColor:colors.accent}}><Ionicons name="pencil" color={colors.textInverse} size={20}/></Pressable>
                </View><Text style={{color:colors.textSecondary}}>{preset.exercise_ids.map(id=>allExercises.find(e=>e.id===id)?.name).filter(Boolean).join(' · ')||'Добавьте упражнения'}</Text></Panel>
            </SwipeToDelete>)}
        </ScrollView>
        <Pressable accessibilityLabel="Создать пресет" onPress={()=>setEditor({})} style={{position:'absolute',right:20,bottom:40,width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',backgroundColor:colors.accent}}><Ionicons name="add" size={28} color={colors.textInverse}/></Pressable>
        {editor&&<ThemeSheet onClose={()=>setEditor(null)}><PresetEditor preset={editor.preset} onSaved={()=>setEditor(null)} onCancel={()=>setEditor(null)}/></ThemeSheet>}
    </View>;
}
