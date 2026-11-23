import { Text } from '@/components/Typography/Typography';
import { Field, Heading } from "@/components/ScreenControls/ScreenControls";
import { SetEditor } from "@/components/SetEditor/SetEditor";
import { ThemeSheet } from "@/components/ThemeSheet/ThemeSheet";
import { useLastResult } from "@/hooks/useDataQueries";
import type { ThemeColors } from "@/theme/colors";
import { formatWorkoutDate } from "@/utils/date";
import type { ResolvedDraftExercise } from "@/utils/resolveDraft";
import type { SetLike } from "@/utils/stats";
import { bestSet, displayNumber } from "@/utils/stats";
import { fromKilograms } from "@/utils/weight";
import { forwardRef, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
export interface SetsSheetRef {
  open: (id: number) => void;
  close: () => void;
}
interface Props {
  colors: ThemeColors;
  draft: ResolvedDraftExercise[];
  excludeWorkoutId?: number;
  onReplaceSets: (id: number, sets: (SetLike & { id?: string })[]) => void;
  onUpdateExerciseComment: (id: number, comment: string) => void;
}
export const SetsSheet = forwardRef<SetsSheetRef, Props>(function SetsSheet(
  { colors, draft, excludeWorkoutId, onReplaceSets, onUpdateExerciseComment },
  ref,
) {
  const [id, setId] = useState<number | null>(null);
  useImperativeHandle(
    ref,
    () => ({ open: setId, close: () => setId(null) }),
    [],
  );
  const exercise = draft.find((e) => e.exercise_id === id);
  const previous = useLastResult(id ?? undefined, excludeWorkoutId);
  const best =
    exercise && previous ? bestSet(exercise.type, previous.sets) : null;
  if (!exercise) return null;
  return (
    <ThemeSheet onClose={() => setId(null)}>
      <Heading>{exercise.name}</Heading>
      {best && previous ? (
        <View
          style={[
            styles.previous,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.previousHeader}>
            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
              Прошлая тренировка
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              {formatWorkoutDate(previous.date)}
            </Text>
          </View>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 22,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
            }}
          >
            {exercise.type === "assisted" ? "Помощь " : ""}
            {displayNumber(best.weight)} кг × {best.reps} повт.
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            {displayNumber(fromKilograms(best.weight, "lb"))} lb
          </Text>
          {!!previous.comment && (
            <Text style={{ color: colors.textSecondary }}>
              Комментарий: {previous.comment}
            </Text>
          )}
        </View>
      ) : (
        <Text style={{ color: colors.textSecondary }}>
          Предыдущих результатов нет
        </Text>
      )}
      <SetEditor
        type={exercise.type}
        sets={exercise.sets}
        onChange={(sets) => onReplaceSets(exercise.exercise_id, sets)}
      />
      <Field
        label="Комментарий к упражнению"
        multiline
        value={exercise.comment ?? ""}
        onChangeText={(value) =>
          onUpdateExerciseComment(exercise.exercise_id, value)
        }
      />
    </ThemeSheet>
  );
});

const styles = StyleSheet.create({
  previous: { padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 },
  previousHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
});
