import { MeasurementLineChart } from '@/components/MeasurementLineChart/MeasurementLineChart';
import { Action, Heading, Panel } from '@/components/ScreenControls/ScreenControls';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
import { Text } from '@/components/Typography/Typography';
import { useExerciseData, useWorkoutData } from '@/hooks/useDataQueries';
import { useTheme } from '@/theme/ThemeContext';
import { headingFont } from '@/theme/typography';
import { formatWorkoutDate } from '@/utils/date';
import { bestSetForMetric, displayNumber, type ExerciseMetric } from '@/utils/stats';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

export default function ExerciseProgressScreen() {
    const colors = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const exercises = useExerciseData();
    const workouts = useWorkoutData();
    const exercise = exercises.data?.find((item) => item.id === Number(id));
    const [metric, setMetric] = useState<ExerciseMetric>('weight');
    const [expanded, setExpanded] = useState<number | null>(null);
    const sessions = useMemo(() => {
        if (!exercise || !workouts.data) return [];
        return workouts.data.flatMap((workout) => {
            const entries = workout.exercises.filter((entry) => entry.exercise_id === exercise.id);
            if (!entries.length) return [];
            const best = bestSetForMetric(exercise.type, entries.flatMap((entry) => entry.sets), metric);
            return [{ id: workout.id, date: workout.date, name: workout.name, entries, best }];
        });
    }, [exercise, metric, workouts.data]);
    const samples = sessions.flatMap(({ id: workoutId, date, best }) =>
        best ? [{ id: workoutId, date, value: best[metric] }] : []).reverse();
    const error = exercises.error ?? workouts.error;
    const status = error?.message ?? (exercises.isPending || workouts.isPending ? 'Загрузка…'
        : !exercise ? 'Упражнение недоступно' : 'Пока нет тренировок с этим упражнением');
    const weightTitle = exercise?.type === 'assisted' ? 'Помощь' : 'Вес';
    const unit = metric === 'weight' ? 'кг' : 'повт.';

    return <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: true, title: exercise?.name ?? 'Прогресс упражнения',
            headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontFamily: headingFont, fontSize: 17 }, headerShadowVisible: false }} />
        <FlatList data={sessions} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={{ color: error ? colors.danger : colors.textSecondary }}>{status}</Text>}
            ListHeaderComponent={sessions.length ? <View style={styles.header}>
                <Panel>
                    <Heading>Прогресс</Heading>
                    <View style={styles.filters}>
                        <Action grow title={weightTitle} selected={metric === 'weight'} onPress={() => setMetric('weight')} />
                        <Action grow title="Повторы" selected={metric === 'reps'} onPress={() => setMetric('reps')} />
                    </View>
                    <Text style={{ color: colors.textSecondary }}>
                        {metric === 'reps' ? 'Больше всего повторов за тренировку'
                            : exercise?.type === 'assisted' ? 'Наименьшая помощь за тренировку' : 'Наибольший вес за тренировку'}
                        {samples.length > 1 ? `, ${unit}` : ''}
                    </Text>
                    {samples.length > 1
                        ? <MeasurementLineChart samples={samples} unit={unit} colors={colors} />
                        : <Text style={{ color: colors.textSecondary }}>График появится после двух тренировок с подходами</Text>}
                </Panel>
                <Heading>История</Heading>
            </View> : undefined}
            renderItem={({ item }) => {
                const open = expanded === item.id;
                return <Panel>
                    <ScalePressable accessibilityRole="button" accessibilityState={{ expanded: open }}
                        onPress={() => setExpanded(open ? null : item.id)} style={styles.sessionHeader}>
                        <View style={styles.sessionInfo}>
                            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.name}</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{formatWorkoutDate(item.date)}</Text>
                            <Text style={{ color: colors.textPrimary, fontVariant: ['tabular-nums'] }}>
                                {item.best
                                    ? `${item.best.reps} повт. × ${displayNumber(item.best.weight)} кг`
                                    : 'Нет подходов'}
                            </Text>
                        </View>
                        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
                    </ScalePressable>
                    {open && item.entries.map((entry, index) => <View key={entry.id} style={[styles.detail, { borderColor: colors.border }]}>
                        {item.entries.length > 1 && <Text style={{ color: colors.textSecondary }}>Запись {index + 1}</Text>}
                        {!!entry.comment.trim() && <Text style={{ color: colors.textPrimary }}>{entry.comment}</Text>}
                        {entry.sets.map((set, setIndex) => <View key={set.id} style={styles.setRow}>
                            <Text style={{ color: colors.textSecondary }}>Подход {setIndex + 1}</Text>
                            <Text style={{ color: colors.textPrimary, fontVariant: ['tabular-nums'] }}>
                                {set.reps} повт. × {displayNumber(set.weight)} кг
                            </Text>
                        </View>)}
                        {!entry.sets.length && <Text style={{ color: colors.textSecondary }}>Нет подходов</Text>}
                    </View>)}
                </Panel>;
            }}
        />
    </View>;
}

const styles = StyleSheet.create({
    list: { padding: 16, paddingBottom: 32, gap: 10 },
    header: { gap: 16, paddingBottom: 4 },
    filters: { flexDirection: 'row', gap: 8 },
    sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
    sessionInfo: { flex: 1, gap: 4 },
    detail: { gap: 8, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
    setRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
});
