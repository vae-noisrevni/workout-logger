import {useState} from 'react';
import {Text,View,ScrollView} from 'react-native';
import {useExercises} from '@/hooks/useExercises';
import {usePresets} from '@/hooks/usePresets';
import {useTheme} from '@/theme/ThemeContext';
import {SetEditor} from '@/components/SetEditor/SetEditor';
import {ExerciseSquare} from '@/components/ExerciseSquare/ExerciseSquare';
import {Action,Field,Heading,Panel} from '@/components/ScreenControls/ScreenControls';
import type {WorkoutPreset,PresetExercise} from '@/types/presets';
export function PresetEditor({preset,initialExercises=[],onSaved,onCancel}:{preset?:WorkoutPreset;initialExercises?:PresetExercise[];onSaved:()=>void;onCancel:()=>void}){
    const colors=useTheme();const {allExercises}=useExercises();const {save,pending}=usePresets();
    const [name,setName]=useState(preset?.name??'');const [plan,setPlan]=useState<PresetExercise[]>(preset?.exercises??initialExercises);
    const [search,setSearch]=useState('');const [error,setError]=useState('');
    const visible=plan.filter(e=>allExercises.some(item=>item.id===e.exercise_id));
    const move=(index:number,direction:number)=>{const next=[...visible];[next[index],next[index+direction]]=[next[index+direction],next[index]];setPlan(next);};
    return <View style={{gap:12}}>
        <Heading>{preset?'Редактировать пресет':'Новый пресет'}</Heading>
        <Field label="Название пресета" value={name} onChangeText={setName}/>
        <Field label="Поиск упражнения" value={search} onChangeText={setSearch}/>
        <ScrollView horizontal contentContainerStyle={{gap:10}} keyboardShouldPersistTaps="handled">
            {allExercises.filter(e=>e.name.toLowerCase().includes(search.trim().toLowerCase())).map(exercise=><ExerciseSquare key={exercise.id} exercise={exercise} colors={colors}
                onPress={()=>{if(!plan.some(e=>e.exercise_id===exercise.id))setPlan([...plan,{exercise_id:exercise.id,sets:[]}]);}}/>)}
        </ScrollView>
        {visible.map((entry,index)=>{const exercise=allExercises.find(e=>e.id===entry.exercise_id)!;return <Panel key={entry.exercise_id}>
            <Heading>{exercise.name}</Heading>
            <View style={{flexDirection:'row',gap:8}}>
                <Action title="↑" disabled={index===0||pending} onPress={()=>move(index,-1)}/><Action title="↓" disabled={index===visible.length-1||pending} onPress={()=>move(index,1)}/>
                <Action title="Убрать" disabled={pending} onPress={()=>setPlan(visible.filter(e=>e.exercise_id!==entry.exercise_id))}/>
            </View>
            <SetEditor type={exercise.type} sets={entry.sets} onChange={sets=>setPlan(plan.map(e=>e.exercise_id===entry.exercise_id?{...e,sets}:e))}/>
        </Panel>;})}
        {!!error&&<Text style={{color:colors.danger}}>{error}</Text>}
        <Action title="Сохранить пресет" selected disabled={pending||!name.trim()||!visible.length} onPress={async()=>{try{await save({id:preset?.id,name,exercises:visible});onSaved();}catch(error){setError(error instanceof Error?error.message:'Не удалось сохранить');}}}/>
        <Action title="Отмена" disabled={pending} onPress={onCancel}/>
    </View>;
}
