// src/components/ExerciseRow/ExerciseRow.tsx
import { EXERCISE_TYPE_ICONS } from '@/constants/exerciseIcons';
import type { ThemeColors } from '@/theme/colors';
import type { Exercise } from '@/types/exercise';
import { EXERCISE_TYPE_LABELS } from '@/types/exercise';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SwipeToDelete } from '@/components/SwipeToDelete/SwipeToDelete';

interface Props {
    exercise: Exercise;
    colors: ThemeColors;
    onPress: () => void;
    onDelete: () => void;
    onToggleFavorite: () => void;
}

export function ExerciseRow({
    exercise,
    colors,
    onPress,
    onDelete,
    onToggleFavorite,
}: Props) {
    const swipeRef = useRef<SwipeableMethods>(null);

    return (
        <SwipeToDelete
            ref={swipeRef}
            radius={12}
            containerStyle={styles.container}
            onDelete={() => {
                swipeRef.current?.close();
                onDelete();
            }}
        >
            <Pressable
                onPress={onPress}
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

                <View style={styles.body}>
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
                </View>

                <Pressable
                    onPress={onToggleFavorite}
                    hitSlop={10}
                    style={styles.star}
                    accessibilityRole="button"
                    accessibilityLabel={
                        exercise.favorite
                            ? 'Убрать из избранного'
                            : 'Добавить в избранное'
                    }
                >
                    <Ionicons
                        name={exercise.favorite ? 'star' : 'star-outline'}
                        size={22}
                        color={
                            exercise.favorite
                                ? colors.accent
                                : colors.textSecondary
                        }
                    />
                </Pressable>
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                />
            </Pressable>
        </SwipeToDelete>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 8 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
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
    star: { paddingHorizontal: 8, paddingVertical: 4, marginRight: 4 },
});
