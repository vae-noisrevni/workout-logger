import { BodyWeightChart } from '@/components/BodyWeightChart/BodyWeightChart';
import { BodyWeightDatePicker } from '@/components/BodyWeightDatePicker/BodyWeightDatePicker';
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
import { Action, Heading, Panel } from '@/components/ScreenControls/ScreenControls';
import { ThemeSheet } from '@/components/ThemeSheet/ThemeSheet';
import { Text, TextInput } from '@/components/Typography/Typography';
import { useBodyWeight } from '@/hooks/useBodyWeight';
import { useTheme } from '@/theme/ThemeContext';
import type { BodyWeightEntry } from '@/types/bodyWeight';
import { dateKey, formatWorkoutDate, todayInputDate } from '@/utils/date';
import { displayNumber } from '@/utils/stats';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export function BodyWeightLog() {
    const colors = useTheme();
    const dialog = useDialog();
    const { entries, error, save: saveEntry, remove, pending } = useBodyWeight();
    const [form, setForm] = useState<{ original: BodyWeightEntry | null; date: string; weight: string } | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [weightError, setWeightError] = useState('');
    const [dateError, setDateError] = useState('');
    const [duplicate, setDuplicate] = useState<BodyWeightEntry | null>(null);
    const [formError, setFormError] = useState('');

    const openForm = (original: BodyWeightEntry | null) => {
        setForm({ original, date: original ? dateKey(original.date) : todayInputDate(),
            weight: original ? String(original.weight_kg) : '' });
        setWeightError('');
        setDateError('');
        setDuplicate(null);
        setFormError('');
    };
    const closeForm = () => setForm(null);

    const save = async () => {
        if (!form || pending) return;
        const date = dateKey(form.date);
        const text = form.weight.trim().replace(',', '.');
        const weight = Number(text);
        if (!date || date > todayInputDate()) {
            setDateError('Выберите дату не позже сегодняшней');
            return;
        }
        if (!/^\d+(?:\.\d*)?$|^\.\d+$/.test(text) || !Number.isFinite(weight) || weight <= 0) {
            setWeightError('Введите вес больше нуля');
            return;
        }
        if (form.original && dateKey(form.original.date) === date && form.original.weight_kg === weight) {
            closeForm();
            return;
        }
        const existing = entries.find((entry) => entry.id !== form.original?.id && dateKey(entry.date) === date);
        if (existing) {
            setDuplicate(existing);
            setDateError('На эту дату уже есть замер');
            return;
        }
        setFormError('');
        try {
            await saveEntry({ date, weight, id: form.original?.id });
            closeForm();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Не удалось сохранить замер');
        }
    };

    const confirmDelete = (entry: BodyWeightEntry) => dialog.show({
        title: 'Удалить замер?',
        message: `${displayNumber(entry.weight_kg)} кг, ${formatWorkoutDate(entry.date)}`,
        buttons: [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Удалить', style: 'destructive', onPress: async () => {
                try {
                    await remove(entry.id);
                } catch {
                    dialog.show({ title: 'Не удалось удалить замер', message: 'Попробуйте ещё раз.' });
                }
            } },
        ],
    });

    return <>
        <Panel>
            <Heading>Вес тела</Heading>
            {!!error && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>}
            <BodyWeightChart entries={entries} colors={colors} />
            <View style={styles.actions}>
                <Action grow selected title="Добавить замер" disabled={pending} onPress={() => openForm(null)} />
                {!!entries.length && <Action grow title={expanded ? 'Скрыть историю' : `История (${entries.length})`}
                    onPress={() => setExpanded(!expanded)} />}
            </View>
            {expanded && !!entries.length && <View style={{ gap: 2 }}>
                {entries.map((entry) => <View key={entry.id} style={[styles.entry, { borderTopColor: colors.border }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                            {displayNumber(entry.weight_kg)} кг
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{formatWorkoutDate(entry.date)}</Text>
                    </View>
                    <ScalePressable accessibilityRole="button" accessibilityLabel={`Изменить замер за ${formatWorkoutDate(entry.date)}`}
                        disabled={pending} onPress={() => openForm(entry)} style={styles.icon}>
                        <Ionicons name="create-outline" size={21} color={colors.textPrimary} />
                    </ScalePressable>
                    <ScalePressable accessibilityRole="button" accessibilityLabel={`Удалить замер за ${formatWorkoutDate(entry.date)}`}
                        disabled={pending} onPress={() => confirmDelete(entry)} style={styles.icon}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </ScalePressable>
                </View>)}
            </View>}
        </Panel>
        {form && <ThemeSheet onClose={closeForm}>
            <Heading>{form.original ? 'Изменить замер' : 'Новый замер'}</Heading>
            <View style={styles.field}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Вес тела</Text>
                <View style={[styles.weightInput, { backgroundColor: colors.surface, borderColor: weightError ? colors.danger : colors.border }]}>
                    <TextInput accessibilityLabel="Вес тела в килограммах" value={form.weight} placeholder="0,0"
                        placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" editable={!pending}
                        underlineColorAndroid="transparent"
                        onChangeText={(weight) => { setForm({ ...form, weight }); setWeightError(''); setFormError(''); }}
                        style={[styles.weightText, { color: colors.textPrimary }]} />
                    <Text style={{ color: colors.textSecondary }}>кг</Text>
                </View>
                {!!weightError && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{weightError}</Text>}
            </View>
            <View style={styles.field}>
                <BodyWeightDatePicker value={form.date} disabled={pending}
                    onChange={(date) => { setForm({ ...form, date }); setDateError(''); setDuplicate(null); setFormError(''); }} />
                {!!dateError && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{dateError}</Text>}
                {duplicate && <Action title="Открыть существующий замер" onPress={() => openForm(duplicate)} />}
            </View>
            {!!formError && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{formError}</Text>}
            <View style={styles.actions}>
                <Action grow title="Отмена" disabled={pending} onPress={closeForm} />
                <Action grow selected title={pending ? 'Сохраняем…' : 'Сохранить'} disabled={pending} onPress={save} />
            </View>
        </ThemeSheet>}
    </>;
}

const styles = StyleSheet.create({
    actions: { flexDirection: 'row', gap: 8 },
    field: { gap: 6 },
    weightInput: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, borderWidth: 1, borderRadius: 12 },
    weightText: { flex: 1, fontSize: 24, fontWeight: '600', fontVariant: ['tabular-nums'], paddingVertical: 6 },
    entry: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
    icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
