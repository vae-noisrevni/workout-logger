// src/components/WorkoutDropZone/WorkoutDropZone.tsx
import type { ThemeColors } from '@/theme/colors';
import type { ResolvedDraftExercise } from '@/utils/resolveDraft';
import { Ionicons } from '@expo/vector-icons';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { WorkoutCard } from '../WorkoutCard/WorkoutCard';

interface Props {
    draft: ResolvedDraftExercise[];
    colors: ThemeColors;
    onCardPress: (exercise: ResolvedDraftExercise) => void;
    onCardRemove: (exerciseId: number) => void;
}

export function WorkoutDropZone({
    draft,
    colors,
    onCardPress,
    onCardRemove,
}: Props) {
    return (
        <View style={styles.container}>
            {draft.length === 0 ? (
                <View style={styles.empty} pointerEvents="none">
                    <Ionicons
                        name="fitness-outline"
                        size={40}
                        color={colors.textSecondary}
                    />
                    <Text
                        style={[
                            styles.emptyText,
                            { color: colors.textSecondary },
                        ]}
                    >
                        Тапни по упражнению сверху,\nчтобы добавить его в тренировку
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                >
                    {draft.map((exercise) => (
                        <WorkoutCard
                            key={exercise.exercise_id}
                            exercise={exercise}
                            colors={colors}
                            onPress={() => onCardPress(exercise)}
                            onRemove={() => onCardRemove(exercise.exercise_id)}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, marginTop: 8, marginHorizontal: 16 },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    list: {
        padding: 12,
        paddingTop: 4,
        paddingBottom: 96,
    },
});
