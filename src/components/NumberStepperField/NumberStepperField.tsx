// src/components/NumberStepperField/NumberStepperField.tsx
import type { ThemeColors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface Props {
    label: string;
    value: number;
    onChange: (value: number) => void;
    colors: ThemeColors;
    /** Шаг кнопок −/+ */
    step?: number;
    /** Разрешить дробную часть (вес) */
    decimal?: boolean;
}

const format = (n: number): string => String(Math.round(n * 100) / 100);

export function NumberStepperField({
    label,
    value,
    onChange,
    colors,
    step = 1,
    decimal = false,
}: Props) {
    // Локальная строка нужна, чтобы можно было стереть поле и ввести «5.» / «0,»
    const [text, setText] = useState(format(value));
    const [focused, setFocused] = useState(false);

    // Внешние изменения (кнопки, восстановление черновика) синхронизируем,
    // пока пользователь сам не печатает
    useEffect(() => {
        if (!focused) setText(format(value));
    }, [value, focused]);

    const commit = (n: number) => {
        const next = Math.max(0, n);
        setText(format(next));
        onChange(next);
    };

    const handleChangeText = (raw: string) => {
        const cleaned = decimal
            ? raw.replace(',', '.').replace(/[^0-9.]/g, '')
            : raw.replace(/[^0-9]/g, '');
        // Не больше одной точки
        const parts = cleaned.split('.');
        const normalized =
            parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
        setText(normalized);
        const n = parseFloat(normalized);
        if (!isNaN(n)) onChange(n);
    };

    const handleBlur = () => {
        setFocused(false);
        const n = parseFloat(text);
        const safe = isNaN(n) ? 0 : n;
        setText(format(safe));
        onChange(safe);
    };

    return (
        <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
                {label}
            </Text>
            <View
                style={[
                    styles.box,
                    {
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceElevated,
                    },
                ]}
            >
                <Pressable
                    onPress={() => commit(value - step)}
                    style={styles.stepBtn}
                    hitSlop={4}
                    accessibilityLabel="Уменьшить"
                >
                    <Ionicons name="remove" size={22} color={colors.accent} />
                </Pressable>
                <TextInput
                    value={text}
                    onChangeText={handleChangeText}
                    onFocus={() => setFocused(true)}
                    onBlur={handleBlur}
                    selectTextOnFocus
                    keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
                    style={[styles.input, { color: colors.textPrimary }]}
                />
                <Pressable
                    onPress={() => commit(value + step)}
                    style={styles.stepBtn}
                    hitSlop={4}
                    accessibilityLabel="Увеличить"
                >
                    <Ionicons name="add" size={22} color={colors.accent} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    field: { flex: 1, gap: 4 },
    label: { fontSize: 12 },
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    // 48dp — минимальная комфортная цель касания
    stepBtn: {
        width: 44,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        paddingVertical: 0,
    },
});
