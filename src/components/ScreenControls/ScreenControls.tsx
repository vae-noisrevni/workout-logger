import type { ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

export function Action({ title, onPress, disabled = false, danger = false, selected = false, icon, grow = false }: {
    title: string; onPress: () => void; disabled?: boolean; danger?: boolean; selected?: boolean;
    icon?: keyof typeof Ionicons.glyphMap; grow?: boolean;
}) {
    const colors = useTheme();
    return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress}
        style={{ padding: icon ? 10 : grow ? 8 : 12, minHeight: 44, flex: grow ? 1 : undefined,
            justifyContent: 'center', alignItems: icon || grow ? 'center' : undefined, borderRadius: 10, borderWidth: 1,
            backgroundColor: selected ? colors.accent : undefined,
            borderColor: danger ? colors.danger : selected ? colors.accent : colors.border, opacity: disabled ? 0.4 : 1 }}>
        {icon ? <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.accent} /> : <Text style={{ textAlign: grow ? 'center' : undefined, color: danger ? colors.danger : selected ? colors.textInverse : colors.accent, fontWeight: '600' }}>{title}</Text>}
    </Pressable>;
}
export function Panel({ children }: { children: ReactNode }) {
    const colors = useTheme();
    return <View style={{ padding: 16, gap: 12, borderRadius: 16, backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border }}>{children}</View>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
    const colors = useTheme();
    return <View style={{ gap: 6 }}>
        <Text style={{ color: colors.textSecondary }}>{label}</Text>
        <TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.textSecondary}
            style={{ minHeight: 48, padding: 12, borderWidth: 1, borderRadius: 10,
                borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceElevated }} />
    </View>;
}
export function Heading({ children }: { children: ReactNode }) {
    const colors = useTheme();
    return <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700' }}>{children}</Text>;
}
