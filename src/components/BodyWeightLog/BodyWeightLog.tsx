import { DateField } from '@/components/DateField/DateField';
import { dateKey, formatWorkoutDate } from '@/utils/date';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useBodyWeight } from '@/hooks/useBodyWeight';
import { todayInputDate } from '@/utils/date';
import { displayNumber } from '@/utils/stats';
import { Action, Field, Heading, Panel } from '@/components/ScreenControls/ScreenControls';
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import type { BodyWeightEntry } from '@/types/bodyWeight';

export function BodyWeightLog() {
    const colors = useTheme();
    const dialog = useDialog();
    const { entries, error, save: saveEntry, remove, pending } = useBodyWeight();
    const [editing, setEditing] = useState<number | null>(null);
    const [date, setDate] = useState(todayInputDate);
    const [weight, setWeight] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [formError, setFormError] = useState('');
    const edit = (entry: BodyWeightEntry) => { setEditing(entry.id); setDate(entry.date); setWeight(String(entry.weight_kg)); setFormError(''); };
    const save = async () => {
        const duplicate = entries.find((entry) => dateKey(entry.date) === dateKey(date) && entry.id !== editing);
        if (duplicate) {
            dialog.show({ title: 'На эту дату уже есть замер', message: 'Открыть его для исправления? Текущий замер пока не изменён.',
                buttons: [{ text: 'Отмена', style: 'cancel' }, { text: 'Изменить существующий', onPress: () => edit(duplicate) }] });
            return;
        }
        try {
            await saveEntry({date:date.trim(),weight:Number(weight.trim().replace(',', '.')),id:editing ?? undefined}); setWeight(''); setDate(todayInputDate()); setEditing(null); setFormError('');
        } catch (error) { setFormError(error instanceof Error ? error.message : 'Не удалось сохранить замер'); }
    };
    return <Panel>
        <Heading>Вес тела</Heading>
        {(error || formError) && <Text style={{ color: colors.danger }}>{error || formError}</Text>}
        <DateField label="Дата замера" value={date} onChangeText={setDate} autoCorrect={false} />
        <Field label="Вес тела (кг)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        <Action title={editing === null ? 'Добавить замер' : 'Сохранить замер'} onPress={save} disabled={pending} />
        {editing !== null && <Action title="Отменить редактирование" onPress={() => { setEditing(null); setWeight(''); setDate(todayInputDate()); setFormError(''); }} />}
        <Action title={`${expanded ? 'Скрыть' : 'Показать'} замеры (${entries.length})`} onPress={() => setExpanded(!expanded)} />
        {expanded && entries.map((entry) => <View key={entry.id} style={{ gap: 8, paddingVertical: 8 }}>
            <Text style={{ color: colors.textPrimary }}>{formatWorkoutDate(entry.date)} · {displayNumber(entry.weight_kg)} кг</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Action title="Изменить" onPress={() => edit(entry)} />
                <Action title="Удалить" danger onPress={() => dialog.show({ title: 'Удалить замер?', message: `${entry.date}: ${displayNumber(entry.weight_kg)} кг`,
                    buttons: [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => {
                        try { remove(entry.id); if (editing === entry.id) { setEditing(null); setWeight(''); } }
                        catch (error) { setFormError(error instanceof Error ? error.message : 'Не удалось удалить'); }
                    } }] })} />
            </View>
        </View>)}
        {!entries.length && <Text style={{ color: colors.textSecondary }}>Добавьте первый замер</Text>}
    </Panel>;
}
