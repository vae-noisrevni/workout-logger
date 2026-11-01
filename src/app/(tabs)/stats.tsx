// src/app/(tabs)/stats.tsx
import { useExercises } from '@/hooks/useExercises';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';
import {
    countWorkoutsInMonth,
    favoriteStats,
    monthOf,
    previousMonth,
    type BestSet,
    type FavoriteStat,
    type StatMetric,
} from '@/utils/stats';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const MONTHS_NOMINATIVE = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
];

const formatShortDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

const unit = (metric: StatMetric): string =>
    metric === 'weight' ? 'кг' : 'повт.';

function formatBest(best: BestSet | null, metric: StatMetric): string {
    if (!best) return '—';
    return metric === 'weight'
        ? `${best.weight} кг × ${best.reps}`
        : `${best.reps} повт.`;
}

function Delta({
    value,
    suffix,
    colors,
}: {
    value: number | null;
    suffix: string;
    colors: ThemeColors;
}) {
    if (value === null) {
        return <Text style={[styles.delta, { color: colors.textSecondary }]}>—</Text>;
    }
    const color =
        value > 0
            ? colors.success
            : value < 0
              ? colors.danger
              : colors.textSecondary;
    const sign = value > 0 ? '+' : '';
    return (
        <Text style={[styles.delta, { color }]}>
            {sign}
            {value}
            {suffix ? ` ${suffix}` : ''}
        </Text>
    );
}

export default function StatsScreen() {
    const colors = useTheme();
    const { workouts } = useWorkouts();
    const { exercises } = useExercises();

    const current = monthOf(new Date());
    const prev = previousMonth(current);
    const currentLabel = MONTHS_NOMINATIVE[current.month];
    const prevLabel = MONTHS_NOMINATIVE[prev.month];

    const counts = useMemo(() => {
        const now = monthOf(new Date());
        return {
            current: countWorkoutsInMonth(workouts, now),
            prev: countWorkoutsInMonth(workouts, previousMonth(now)),
        };
    }, [workouts]);

    const favorites = useMemo(
        () =>
            favoriteStats(
                workouts,
                exercises.filter((e) => e.favorite),
                monthOf(new Date()),
            ),
        [workouts, exercises],
    );

    return (
        <ScrollView
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.content}
        >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Тренировок в месяц
            </Text>
            <View
                style={[
                    styles.card,
                    styles.countsCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    },
                ]}
            >
                <View style={styles.countCell}>
                    <Text style={[styles.countValue, { color: colors.textPrimary }]}>
                        {counts.current}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>
                        {currentLabel}
                    </Text>
                </View>
                <View style={styles.countCell}>
                    <Text
                        style={[styles.countValue, { color: colors.textSecondary }]}
                    >
                        {counts.prev}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>{prevLabel}</Text>
                </View>
                <View style={styles.countCell}>
                    <Delta
                        value={counts.current - counts.prev}
                        suffix=""
                        colors={colors}
                    />
                    <Text style={{ color: colors.textSecondary }}>разница</Text>
                </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Избранные упражнения
            </Text>
            {favorites.length === 0 ? (
                <View
                    style={[
                        styles.card,
                        styles.empty,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Ionicons
                        name="star-outline"
                        size={28}
                        color={colors.textSecondary}
                    />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Отметь упражнения звёздочкой на вкладке «Упражнения» —
                        здесь появятся их рекорды и прогресс
                    </Text>
                </View>
            ) : (
                favorites.map((stat) => (
                    <FavoriteCard
                        key={stat.exercise.id}
                        stat={stat}
                        colors={colors}
                        currentLabel={currentLabel}
                        prevLabel={prevLabel}
                    />
                ))
            )}
        </ScrollView>
    );
}

function FavoriteCard({
    stat,
    colors,
    currentLabel,
    prevLabel,
}: {
    stat: FavoriteStat;
    colors: ThemeColors;
    currentLabel: string;
    prevLabel: string;
}) {
    const { exercise, metric, allTime, thisMonth, lastMonth, delta } = stat;
    return (
        <View
            style={[
                styles.card,
                styles.favCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
        >
            <View style={[styles.colorBar, { backgroundColor: exercise.color }]} />
            <View style={styles.favBody}>
                <Text
                    numberOfLines={1}
                    style={[styles.favName, { color: colors.textPrimary }]}
                >
                    {exercise.name}
                </Text>

                {allTime ? (
                    <>
                        <View style={styles.recordRow}>
                            <Ionicons name="trophy-outline" size={16} color={colors.accent} />
                            <Text style={[styles.recordValue, { color: colors.textPrimary }]}>
                                {formatBest(allTime, metric)}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                                {formatShortDate(allTime.date)}
                            </Text>
                        </View>

                        <View style={styles.monthRow}>
                            <View style={styles.monthCell}>
                                <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                                    {currentLabel}
                                </Text>
                                <Text style={[styles.monthValue, { color: colors.textPrimary }]}>
                                    {formatBest(thisMonth, metric)}
                                </Text>
                            </View>
                            <View style={styles.monthCell}>
                                <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                                    {prevLabel}
                                </Text>
                                <Text style={[styles.monthValue, { color: colors.textSecondary }]}>
                                    {formatBest(lastMonth, metric)}
                                </Text>
                            </View>
                            <View style={styles.monthCell}>
                                <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                                    прогресс
                                </Text>
                                <Delta value={delta} suffix={unit(metric)} colors={colors} />
                            </View>
                        </View>
                    </>
                ) : (
                    <Text style={{ color: colors.textSecondary }}>
                        Ещё не было в тренировках
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { padding: 16, gap: 10, paddingBottom: 40 },
    sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 6 },
    card: { borderRadius: 14, borderWidth: 1 },
    countsCard: { flexDirection: 'row', padding: 16 },
    countCell: { flex: 1, alignItems: 'center', gap: 2 },
    countValue: { fontSize: 28, fontWeight: '700' },
    delta: { fontSize: 18, fontWeight: '700' },
    empty: { alignItems: 'center', padding: 20, gap: 10 },
    emptyText: { textAlign: 'center', lineHeight: 20 },
    favCard: { flexDirection: 'row', overflow: 'hidden' },
    colorBar: { width: 5 },
    favBody: { flex: 1, padding: 14, gap: 10 },
    favName: { fontSize: 16, fontWeight: '600' },
    recordRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    recordValue: { fontSize: 16, fontWeight: '700', flex: 1 },
    monthRow: { flexDirection: 'row', gap: 8 },
    monthCell: { flex: 1, gap: 2 },
    monthLabel: { fontSize: 12 },
    monthValue: { fontSize: 15, fontWeight: '600' },
});
