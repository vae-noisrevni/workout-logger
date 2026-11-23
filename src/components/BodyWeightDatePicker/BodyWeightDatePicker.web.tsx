import { Text } from '@/components/Typography/Typography';
import { useTheme, useThemeMode } from '@/theme/ThemeContext';
import { bodyFonts } from '@/theme/typography';
import { todayInputDate } from '@/utils/date';
import { View } from 'react-native';

export function BodyWeightDatePicker({ value, onChange, disabled }: {
    value: string;
    onChange: (date: string) => void;
    disabled: boolean;
}) {
    const colors = useTheme();
    const { mode } = useThemeMode();
    return <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Дата замера</Text>
        <input aria-label="Дата замера" type="date" value={value} max={todayInputDate()} disabled={disabled}
            onChange={(event) => { if (event.target.value) onChange(event.target.value); }}
            style={{ boxSizing: 'border-box', minHeight: 48, borderRadius: 12, padding: '8px 12px',
                border: `1px solid ${colors.border}`, backgroundColor: colors.surfaceElevated, color: colors.textPrimary,
                colorScheme: mode === 'system' ? 'light dark' : mode, font: `16px ${bodyFonts.regular}, sans-serif` }} />
    </View>;
}
