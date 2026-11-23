import { Text } from '@/components/Typography/Typography';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
import { ListSearchHeader } from '@/components/ListSearchHeader/ListSearchHeader';
import { Ionicons } from '@expo/vector-icons';
import { PresetExerciseList } from '@/components/PresetExerciseList/PresetExerciseList';
import {useTransferActions} from '@/components/TransferControls/TransferControls';
import {useMemo,useState} from 'react';
import {StyleSheet,View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
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
    const exercisesById=useMemo(()=>new Map(allExercises.map(exercise=>[exercise.id,exercise])),[allExercises]);
    const {actions:transferActions,pending:transferPending}=useTransferActions('presets');
    const [search,setSearch]=useState('');
    const query=search.trim().toLowerCase();
    const visiblePresets=presets.filter(preset=>!query||preset.name.toLowerCase().includes(query)||
        preset.exercise_ids.some(id=>exercisesById.get(id)?.name.toLowerCase().includes(query)));
    const [editor,setEditor]=useState<{preset?:WorkoutPreset}|null>(null);
    return <View style={{flex:1,backgroundColor:colors.background}}>
        <ListSearchHeader search={search} onSearchChange={setSearch} placeholder="Поиск пресетов" actions={[
            {id:'create', icon: 'add-circle-outline',title:'Создать пресет',disabled:pending,onPress:()=>setEditor({})},
            ...transferActions,
        ]}/>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,gap:12}}>
            {transferPending&&<Text style={{color:colors.textSecondary}}>Обработка данных…</Text>}
            {error&&<Text style={{color:colors.danger}}>{error}</Text>}
            {!presets.length&&<Text style={{color:colors.textSecondary}}>Пока нет пресетов</Text>}
            {!!presets.length&&!visiblePresets.length&&<Text style={{color:colors.textSecondary}}>Ничего не найдено</Text>}
            {visiblePresets.map(preset=><SwipeToDelete key={preset.id} radius={16} onDelete={()=>{if(pending)return;dialog.show({title:'Удалить пресет?',message:'Сохранённые тренировки останутся в истории.',buttons:[{text:'Отмена',style:'cancel'},{text:'Удалить',style:'destructive',onPress:()=>remove(preset.id)}]});}}>
                <Panel>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitle}><Heading>{preset.name}</Heading></View>
                        <ScalePressable accessibilityRole="button" accessibilityLabel={`Редактировать пресет ${preset.name}`}
                            disabled={pending} onPress={()=>setEditor({preset})}
                            style={[styles.edit,{backgroundColor:colors.surfaceElevated,opacity:pending?0.5:1}]}>
                            <Ionicons name="create-outline" size={21} color={colors.textPrimary}/>
                        </ScalePressable>
                    </View>
                    <PresetExerciseList plan={preset.exercises} exercisesById={exercisesById} inline/>
                </Panel>
            </SwipeToDelete>)}
        </ScrollView>
        {editor&&<ThemeSheet scroll={false} onClose={()=>setEditor(null)}>
            <PresetEditor preset={editor.preset} onSaved={()=>setEditor(null)} onCancel={()=>setEditor(null)}/>
        </ThemeSheet>}
    </View>;
}


const styles=StyleSheet.create({
    cardHeader:{flexDirection:'row',alignItems:'center',gap:8},
    cardTitle:{flex:1},
    edit:{minWidth:44,minHeight:44,borderRadius:10,alignItems:'center',justifyContent:'center'},
});
