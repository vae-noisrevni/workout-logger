import {Text} from 'react-native';
import {useTheme} from '@/theme/ThemeContext';
import {displayNumber} from '@/utils/stats';
import {fromKilograms} from '@/utils/weight';
export function WeightValue({value}:{value:number}){const colors=useTheme();return <Text style={{color:colors.textPrimary}}>{displayNumber(value)} кг <Text style={{fontSize:11,color:colors.textSecondary}}>({displayNumber(fromKilograms(value,'lb'))} lb)</Text></Text>;}
