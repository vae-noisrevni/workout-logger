import {forwardRef,useImperativeHandle,useState} from 'react';
import {Text} from 'react-native';
import {ThemeSheet} from '@/components/ThemeSheet/ThemeSheet';
import {SetEditor} from '@/components/SetEditor/SetEditor';
import {Field,Heading} from '@/components/ScreenControls/ScreenControls';
import {WeightValue} from '@/components/WeightValue/WeightValue';
import {useLastResult} from '@/hooks/useDataQueries';
import {bestSet} from '@/utils/stats';
import {formatWorkoutDate} from '@/utils/date';
import type {ResolvedDraftExercise} from '@/utils/resolveDraft';
import type {ThemeColors} from '@/theme/colors';
import type {SetLike} from '@/utils/stats';
export interface SetsSheetRef {open:(id:number)=>void;close:()=>void}
interface Props {
    colors:ThemeColors;draft:ResolvedDraftExercise[];excludeWorkoutId?:number;
    onReplaceSets:(id:number,sets:(SetLike & {id?:string})[])=>void;
    onUpdateExerciseComment:(id:number,comment:string)=>void;
}
export const SetsSheet=forwardRef<SetsSheetRef,Props>(function SetsSheet({colors,draft,excludeWorkoutId,onReplaceSets,onUpdateExerciseComment},ref){
    const [id,setId]=useState<number|null>(null);
    useImperativeHandle(ref,()=>({open:setId,close:()=>setId(null)}),[]);
    const exercise=draft.find(e=>e.exercise_id===id);
    const previous=useLastResult(id??undefined,excludeWorkoutId);
    const best=exercise&&previous?bestSet(exercise.type,previous.sets):null;
    if(!exercise)return null;
    return <ThemeSheet onClose={()=>setId(null)}>
        <Heading>{exercise.name}</Heading>
        {best&&previous?<Text style={{color:colors.textSecondary}}>Прошлая тренировка {formatWorkoutDate(previous.date)}: <WeightValue value={best.weight}/> × {best.reps} повт.</Text>:<Text style={{color:colors.textSecondary}}>Предыдущих результатов нет</Text>}
        <SetEditor type={exercise.type} sets={exercise.sets} onChange={sets=>onReplaceSets(exercise.exercise_id,sets)}/>
        {!!previous?.comment&&<Text style={{color:colors.textSecondary}}>Прошлый комментарий: {previous.comment}</Text>}
        <Field label="Комментарий к упражнению" multiline value={exercise.comment??''} onChangeText={value=>onUpdateExerciseComment(exercise.exercise_id,value)}/>
    </ThemeSheet>;
});
