import { Text } from '@/components/Typography/Typography';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
// src/components/ExerciseRow/ExerciseRow.tsx
import { EXERCISE_TYPE_ICONS } from '@/constants/exerciseIcons';
import type { ThemeColors } from '@/theme/colors';
import type { Exercise } from '@/types/exercise';
import { EXERCISE_TYPE_LABELS } from '@/types/exercise';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { SwipeToDelete } from '@/components/SwipeToDelete/SwipeToDelete';

interface Props {
    exercise: Exercise;
    colors: ThemeColors;
    onPress: () => void;
    onDelete: () => void;
    onToggleFavorite: () => void;
    onOpenProgress: () => void;
}

export function ExerciseRow({ exercise, colors, onPress, onDelete, onToggleFavorite, onOpenProgress }: Props) {
    return (
        <SwipeToDelete radius={12} onDelete={onDelete}>
            <View
                style={[
                    styles.row,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    },
                ]}
            >
                <View
                    style={[
                        styles.colorBar,
                        { backgroundColor: exercise.color },
                    ]}
                />

                <Pressable accessibilityRole="button" accessibilityLabel={`Редактировать упражнение ${exercise.name}`}
                    onPress={onPress} style={styles.body}>
                    <View style={styles.headerRow}>
                        <Ionicons
                            name={EXERCISE_TYPE_ICONS[exercise.type]}
                            size={16}
                            color={colors.textSecondary}
                        />
                        <Text
                            numberOfLines={1}
                            style={[styles.name, { color: colors.textPrimary }]}
                        >
                            {exercise.name}
                        </Text>
                    </View>

                    <View style={styles.metaRow}>
                        <View
                            style={[
                                styles.typeChip,
                                {
                                    backgroundColor: colors.surfaceElevated,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.typeText,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                {EXERCISE_TYPE_LABELS[exercise.type]}
                            </Text>
                        </View>

                        {exercise.description ? (
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.description,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                {exercise.description}
                            </Text>
                        ) : null}
                    </View>
                </Pressable>

                <ScalePressable pressedScale={0.82} accessibilityRole="button" onPress={onToggleFavorite} hitSlop={10} accessibilityLabel={exercise.is_favorite ? 'Убрать из избранного' : 'Добавить в избранное'} style={{ padding: 12 }}>
                    <Ionicons name={exercise.is_favorite ? 'heart' : 'heart-outline'} size={24} color={colors.favorite} />
                </ScalePressable>
                <ScalePressable accessibilityRole="button" accessibilityLabel={`Прогресс упражнения ${exercise.name}`}
                    style={styles.progress} onPress={onOpenProgress}>
                    <Ionicons name="stats-chart-outline" size={22} color={colors.textPrimary} />
                </ScalePressable>
            </View>
        </SwipeToDelete>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progress: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
    colorBar: { width: 5, alignSelf: 'stretch' },
    body: { flex: 1, padding: 14, gap: 6 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { flex: 1, fontSize: 16, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeChip: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    typeText: { fontSize: 11, fontWeight: '500' },
    description: { flex: 1, fontSize: 13 },
    deleteAction: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderRadius: 12,
        marginLeft: 8,
    },
});
