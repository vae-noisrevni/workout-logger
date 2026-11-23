import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
import { Text } from '@/components/Typography/Typography';
import { useTheme, useThemeMode } from '@/theme/ThemeContext';
import { dateKey, formatWorkoutDate, resolveDate, todayInputDate } from '@/utils/date';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';

export function BodyWeightDatePicker({ value, onChange, disabled }: {
    value: string;
    onChange: (date: string) => void;
    disabled: boolean;
}) {
    const colors = useTheme();
    const { mode } = useThemeMode();
    const [open, setOpen] = useState(false);
    const today = todayInputDate();
    const selectedDate = resolveDate(value <= today ? value : today) ?? new Date();
    const picker = <DateTimePicker
        value={selectedDate}
        mode="date"
        display={Platform.OS === 'ios' ? 'compact' : 'default'}
        maximumDate={new Date()}
        locale="ru_RU"
        themeVariant={mode === 'system' ? undefined : mode}
        disabled={disabled}
        positiveButton={{ label: 'Выбрать' }}
        negativeButton={{ label: 'Отмена' }}
        onDismiss={() => setOpen(false)}
        onValueChange={(_, date) => {
            onChange(dateKey(date.toISOString()));
            setOpen(false);
        }}
    />;

    return <View style={styles.group}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Дата замера</Text>
        {Platform.OS === 'ios' ? picker : <>
            <ScalePressable accessibilityRole="button" accessibilityLabel={`Дата замера, ${formatWorkoutDate(value)}`}
                disabled={disabled} onPress={() => { Keyboard.dismiss(); setOpen(true); }}
                style={[styles.trigger, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={{ color: colors.textPrimary, flex: 1 }}>
                    {value === today ? `Сегодня, ${formatWorkoutDate(value)}` : formatWorkoutDate(value)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </ScalePressable>
            {open && picker}
        </>}
    </View>;
}

const styles = StyleSheet.create({
    group: { gap: 6, alignItems: 'stretch' },
    label: { fontSize: 13, fontWeight: '600' },
    trigger: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
});
