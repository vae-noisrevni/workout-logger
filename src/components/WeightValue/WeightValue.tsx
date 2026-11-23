import { Text } from '@/components/Typography/Typography';
import {useTheme} from '@/theme/ThemeContext';
import {displayNumber} from '@/utils/stats';
import {fromKilograms} from '@/utils/weight';
export function WeightValue({value}:{value:number}){const colors=useTheme();return <Text style={{color:colors.textPrimary,fontVariant:['tabular-nums']}}>{displayNumber(value)} кг <Text style={{fontSize:11,color:colors.textSecondary}}>({displayNumber(fromKilograms(value,'lb'))} lb)</Text></Text>;}
