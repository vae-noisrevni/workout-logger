import { Text } from '@/components/Typography/Typography';
// src/components/WorkoutDropZone/WorkoutDropZone.tsx
import type { ThemeColors } from "@/theme/colors";
import type { ResolvedDraftExercise } from "@/utils/resolveDraft";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { ReorderableExerciseList } from "../ReorderableExerciseList/ReorderableExerciseList";
import { WorkoutCard } from "../WorkoutCard/WorkoutCard";

interface Props {
  draft: ResolvedDraftExercise[];
  colors: ThemeColors;
  onCardPress: (exercise: ResolvedDraftExercise) => void;
  onCardRemove: (exerciseId: number) => void;
  onMove: (exerciseId: number, targetId: number) => void;
}

export function WorkoutDropZone({
  draft,
  colors,
  onCardPress,
  onCardRemove,
  onMove,
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
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Тапни по упражнению сверху, чтобы добавить его в тренировку
          </Text>
        </View>
      ) : (
        <ReorderableExerciseList
          items={draft}
          onMove={onMove}
          handleColor={colors.textSecondary}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={(exercise, dragHandle) => <WorkoutCard
            exercise={exercise}
            colors={colors}
            onPress={() => onCardPress(exercise)}
            onRemove={() => onCardRemove(exercise.exercise_id)}
            dragHandle={dragHandle}
          />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 8, marginHorizontal: 16 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    padding: 12,
    paddingTop: 4,
    paddingBottom: 96,
  },
});
