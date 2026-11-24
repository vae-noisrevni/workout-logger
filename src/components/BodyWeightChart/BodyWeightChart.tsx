import { MeasurementLineChart } from '@/components/MeasurementLineChart/MeasurementLineChart';
import { Text } from '@/components/Typography/Typography';
import { View } from 'react-native';
import type { ThemeColors } from '@/theme/colors';
import type { BodyWeightEntry } from '@/types/bodyWeight';
import { formatWorkoutDate } from '@/utils/date';
import { displayNumber } from '@/utils/stats';

export function BodyWeightChart({ entries, colors }: {
    entries: BodyWeightEntry[];
    colors: ThemeColors;
}) {
    const latest = entries[0];
    const previous = entries[1];
    if (!latest) return <Text style={{ color: colors.textSecondary }}>Пока нет замеров</Text>;

    const samples = entries.slice(0, 12).reverse();
    const diff = previous ? latest.weight_kg - previous.weight_kg : 0;

    return <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], color: colors.textPrimary }}>
            {displayNumber(latest.weight_kg)} кг
        </Text>
        <Text style={{ color: colors.textSecondary }}>
            Последний замер {formatWorkoutDate(latest.date)}
        </Text>
        {previous && <Text style={{ color: colors.textPrimary, fontVariant: ['tabular-nums'] }}>
            {diff > 0 ? '+' : ''}{displayNumber(diff)} кг с предыдущего замера
        </Text>}
        {!previous && <Text style={{ color: colors.textSecondary }}>График появится после второго замера</Text>}
        {entries.length > samples.length && <Text style={{ color: colors.textSecondary }}>Последние {samples.length} замеров</Text>}
        <MeasurementLineChart samples={samples.map(({ id, date, weight_kg }) => ({ id, date, value: weight_kg }))}
            unit="кг" colors={colors} />
    </View>;
}
