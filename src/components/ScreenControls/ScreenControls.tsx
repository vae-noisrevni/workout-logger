import { primaryButton } from '@/theme/primaryButton';
import { Text, TextInput } from '@/components/Typography/Typography';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
import { headingFont } from '@/theme/typography';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

export function Action({ title, onPress, disabled = false, danger = false, selected = false, icon, grow = false }: {
    title: string; onPress: () => void; disabled?: boolean; danger?: boolean; selected?: boolean;
    icon?: keyof typeof Ionicons.glyphMap; grow?: boolean;
}) {
    const colors = useTheme();
    return <ScalePressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress}
        style={{ padding: icon ? 10 : grow ? 8 : 12, minHeight: 44, flex: grow ? 1 : undefined,
            justifyContent: 'center', alignItems: icon || grow ? 'center' : undefined, flexDirection: icon ? 'row' : undefined, gap: icon ? 8 : undefined, borderRadius: 12, borderWidth: 1,
            ...(selected ? primaryButton(colors) : { backgroundColor: colors.surface }),
            borderColor: danger ? colors.danger : selected ? colors.accent : colors.border, opacity: disabled ? 0.4 : 1 }}>
        {icon && <Ionicons name={icon} size={20} color={danger ? colors.danger : selected ? colors.textInverse : colors.textPrimary} />}
        <Text style={{ flexShrink: 1, textAlign: grow ? 'center' : undefined, color: danger ? colors.danger : selected ? colors.textInverse : colors.textPrimary, fontWeight: '600' }}>{title}</Text>
    </ScalePressable>;
}
export function Panel({ children }: { children: ReactNode }) {
    const colors = useTheme();
    return <View style={{ padding: 16, gap: 12, borderRadius: 16, backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border }}>{children}</View>;
}
export function Field({ label, value, placeholder, style, onFocus, onBlur, ...props }: TextInputProps & {
    label: string;
    value: string;
}) {
    const colors = useTheme();
    const [focused, setFocused] = useState(false);
    const floating = focused || value.length > 0;

    return <View>
        {floating && <Text accessible={false} style={[fieldStyles.label, { color: focused ? colors.textPrimary : colors.textSecondary }]}>{label}</Text>}
        <TextInput {...props} value={value} accessibilityLabel={label}
            placeholder={floating ? placeholder : label} placeholderTextColor={colors.textSecondary}
            underlineColorAndroid="transparent"
            onFocus={(event) => { setFocused(true); onFocus?.(event); }}
            onBlur={(event) => { setFocused(false); onBlur?.(event); }}
            style={[fieldStyles.input, props.multiline && fieldStyles.multiline, { color: colors.textPrimary }, style]} />
    </View>;
}

const fieldStyles = StyleSheet.create({
    label: { fontSize: 12, fontWeight: '600' },
    input: { minHeight: 44, fontSize: 16, paddingHorizontal: 0, paddingVertical: 6 },
    multiline: { minHeight: 70, textAlignVertical: 'top' },
});

export function Heading({ children }: { children: ReactNode }) {
    const colors = useTheme();
    return <Text style={{ color: colors.textPrimary, fontSize: 18, fontFamily: headingFont }}>{children}</Text>;
}
