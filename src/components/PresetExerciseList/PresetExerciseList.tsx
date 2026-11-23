import { Text } from '@/components/Typography/Typography';
import type { Exercise } from '@/types/exercise';
import type { PresetExercise } from '@/types/presets';
import { useTheme } from '@/theme/ThemeContext';
import { StyleSheet, View } from 'react-native';

export function PresetExerciseList({ plan, exercisesById, showSets = false, inline = false }: {
    plan: PresetExercise[];
    exercisesById: ReadonlyMap<number, Exercise>;
    showSets?: boolean;
    inline?: boolean;
}) {
    const colors = useTheme();
    if (!plan.length) return <Text style={{ color: colors.textSecondary }}>Нет упражнений</Text>;

    if (inline) return <Text style={{ color: colors.textPrimary }}>
        {plan.map(({ exercise_id }, index) => {
            const exercise = exercisesById.get(exercise_id);
            return <Text key={exercise_id}>
                {index > 0 ? '   ' : ''}<Text style={{ color: exercise?.color ?? colors.textSecondary }}>●</Text>
                {'\u00a0'}{exercise?.name ?? 'Упражнение недоступно'}
            </Text>;
        })}
    </Text>;

    return <View style={styles.list}>
        {plan.map(({ exercise_id, sets }) => {
            const exercise = exercisesById.get(exercise_id);
            return <View key={exercise_id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: exercise?.color ?? colors.border }]} />
                <Text style={{ flex: 1, color: colors.textPrimary }}>{exercise?.name ?? 'Упражнение недоступно'}</Text>
                {showSets && <Text style={{ color: colors.textSecondary }}>{sets.length} подх.</Text>}
            </View>;
        })}
    </View>;
}

const styles = StyleSheet.create({
    list: { gap: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
});
