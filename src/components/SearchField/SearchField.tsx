import { TextInput } from '@/components/Typography/Typography';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

export function SearchField({ value, onChangeText, placeholder }: {
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
}) {
    const colors = useTheme();
    return <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
            accessibilityLabel={placeholder} placeholderTextColor={colors.textSecondary}
            autoCorrect={false} returnKeyType="search" underlineColorAndroid="transparent"
            style={[styles.input, { color: colors.textPrimary }]} />
        {!!value && <Pressable accessibilityRole="button" accessibilityLabel="Очистить поиск"
            onPress={() => onChangeText('')} style={styles.clear}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
        </Pressable>}
    </View>;
}

const styles = StyleSheet.create({
    field: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48,
        paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
    input: { flex: 1, minWidth: 0, fontSize: 16, paddingVertical: 8 },
    clear: { minWidth: 44, minHeight: 44, marginRight: -8, alignItems: 'center', justifyContent: 'center' },
});
