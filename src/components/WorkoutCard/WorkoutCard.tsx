// src/components/WorkoutCard/WorkoutCard.tsx
import { EXERCISE_TYPE_ICONS } from '@/constants/exerciseIcons';
import type { ThemeColors } from '@/theme/colors';
import { ResolvedDraftExercise } from '@/utils/resolveDraft';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    exercise: ResolvedDraftExercise;
    colors: ThemeColors;
    onPress: () => void;
    onRemove: () => void;
}

export function WorkoutCard({ exercise, colors, onPress, onRemove }: Props) {
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
        >
            <View
                style={[styles.colorBar, { backgroundColor: exercise.color }]}
            />

            <View style={styles.body}>
                <View style={styles.header}>
                    {/* Иконка типа */}
                    <Ionicons
                        name={EXERCISE_TYPE_ICONS[exercise.type]}
                        size={18}
                        color={colors.textSecondary}
                    />
                    <Text
                        numberOfLines={1}
                        style={[styles.name, { color: colors.textPrimary }]}
                    >
                        {exercise.name}
                    </Text>
                    <Pressable
                        onPress={onRemove}
                        hitSlop={14}
                        style={styles.removeButton}
                    >
                        <Ionicons
                            name="close-circle"
                            size={22}
                            color={colors.textSecondary}
                        />
                    </Pressable>
                </View>

                <View style={styles.setsList}>
                    {exercise.sets.map((set, index) => (
                        <View key={set.id} style={styles.setRow}>
                            <Text
                                style={[
                                    styles.setIndex,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                {index + 1}
                            </Text>
                            <Text
                                style={[
                                    styles.setValue,
                                    { color: colors.textPrimary },
                                ]}
                            >
                                {set.reps}
                                <Text style={{ color: colors.textSecondary }}>
                                    {' '}
                                    повт.
                                </Text>
                            </Text>
                            {exercise.type !== 'bodyweight' && (
                                <Text
                                    style={[
                                        styles.setWeight,
                                        { color: colors.textPrimary },
                                    ]}
                                >
                                    {set.weight}
                                    <Text
                                        style={{ color: colors.textSecondary }}
                                    >
                                        {' '}
                                        кг
                                    </Text>
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
        overflow: 'hidden',
    },
    colorBar: {
        width: 5,
    },
    body: {
        flex: 1,
        padding: 14,
        gap: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    removeButton: {
        padding: 2,
    },
    setsList: { gap: 6 },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    setIndex: {
        width: 18,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    setValue: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
    },
    setWeight: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
    },
});
