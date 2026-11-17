import type {TextInputProps} from 'react-native';
import {Field} from '@/components/ScreenControls/ScreenControls';
import {formatWorkoutDate,maskDate} from '@/utils/date';
export function DateField({value='',onChangeText,...props}:TextInputProps&{label:string}){
    const text=/^\d{4}[-.]\d{2}[-.]\d{2}$/.test(value)?formatWorkoutDate(value):value;
    return <Field {...props} value={text} placeholder="ДД.ММ.ГГГГ" keyboardType="number-pad" maxLength={10} onChangeText={raw=>onChangeText?.(maskDate(raw))}/>;
}
