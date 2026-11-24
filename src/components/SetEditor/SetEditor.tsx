import { Text } from '@/components/Typography/Typography';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
import {StyleSheet,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {NumberStepperField} from '@/components/NumberStepperField/NumberStepperField';
import {useTheme} from '@/theme/ThemeContext';
import {fromKilograms} from '@/utils/weight';
import {displayNumber} from '@/utils/stats';
import type {ExerciseType} from '@/types/exercise';
export interface EditableSet {id?:string;reps:number;weight:number}
export const nextSet=(sets:EditableSet[]):EditableSet=>({reps:sets.at(-1)?.reps??10,weight:sets.at(-1)?.weight??0,id:`${Date.now()}-${Math.random()}`});
export function SetEditor({type,sets,onChange}:{type:ExerciseType;sets:EditableSet[];onChange:(sets:EditableSet[])=>void}){
    const colors=useTheme();
    const update=(index:number,patch:Partial<EditableSet>)=>onChange(sets.map((set,i)=>i===index?{...set,...patch}:set));
    return <View style={{gap:10}}>
        {sets.map((set,index)=><View key={set.id??index} style={{padding:8,borderRadius:12,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
                <Text style={{width:16,color:colors.textSecondary}}>{index+1}</Text>
                <NumberStepperField compact label="Повторы" value={set.reps} onChange={reps=>update(index,{reps})} colors={colors}/>
                <NumberStepperField compact label={type==='bodyweight'?'Утяжеление, кг':type==='assisted'?'Помощь, кг':'Вес, кг'} value={set.weight} decimal step={2.5} onChange={weight=>update(index,{weight})} colors={colors}/>
                <ScalePressable accessibilityLabel={`Удалить подход ${index+1}`} onPress={()=>onChange(sets.filter((_,i)=>i!==index))} hitSlop={8}><Ionicons name="trash-outline" size={20} color={colors.danger}/></ScalePressable>
            </View>
            <Text style={{fontSize:11,color:colors.textSecondary,textAlign:'right',marginRight:26}}>{displayNumber(fromKilograms(set.weight,'lb'))} lb</Text>
        </View>)}
        <ScalePressable accessibilityRole="button" hitSlop={{top:4,bottom:4}} onPress={()=>onChange([...sets,nextSet(sets)])}
            style={[styles.add,{backgroundColor:colors.accentTint,borderColor:colors.accentTint}]}>
            <Ionicons name="add" size={16} color={colors.textPrimary} style={styles.addIcon}/>
            <Text style={[styles.addLabel,{color:colors.textPrimary}]}>Добавить подход</Text>
        </ScalePressable>
    </View>;
}

const styles=StyleSheet.create({
    add:{minHeight:36,alignSelf:'stretch',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,
        paddingHorizontal:9,paddingVertical:4,borderRadius:10,borderWidth:1,
        elevation:3,shadowColor:'#000',shadowOpacity:0.2,shadowRadius:5,shadowOffset:{width:0,height:2}},
    addIcon:{backgroundColor:'transparent'},
    addLabel:{fontSize:12,fontWeight:'600',flexShrink:1,backgroundColor:'transparent'},
});
