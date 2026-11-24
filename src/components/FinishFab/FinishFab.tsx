import { primaryButton } from '@/theme/primaryButton';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
// src/components/FinishFab/FinishFab.tsx
import type { ThemeColors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

interface Props {
    colors: ThemeColors;
    onPress: () => void;
    disabled?: boolean;
}

export function FinishFab({ colors, onPress, disabled = false }: Props) {
    return (
        <ScalePressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Завершить тренировку"
            style={[
                styles.fab,
                {
                    ...primaryButton(colors),
                    opacity: disabled ? 0.4 : 1,
                },
            ]}
            hitSlop={8}
        >
            <Ionicons
                name="checkmark-done"
                size={26}
                color={colors.textInverse}
            />
        </ScalePressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        zIndex: 100,
    },
});
