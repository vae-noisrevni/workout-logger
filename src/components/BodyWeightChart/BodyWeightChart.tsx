import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '@/theme/colors';
import type { BodyWeightEntry } from '@/types/bodyWeight';
import { formatWorkoutDate, resolveDate } from '@/utils/date';
import { displayNumber } from '@/utils/stats';

const PLOT_HEIGHT = 100;

export function BodyWeightChart({ entries, colors }: {
    entries: BodyWeightEntry[];
    colors: ThemeColors;
}) {
    const [width, setWidth] = useState(0);
    const latest = entries[0];
    const previous = entries[1];
    if (!latest) return <Text style={{ color: colors.textSecondary }}>Добавьте первый замер</Text>;

    const samples = entries.slice(0, 12).reverse();
    const weights = samples.map((entry) => entry.weight_kg);
    const min = Math.floor(Math.min(...weights) - 0.5);
    const max = Math.ceil(Math.max(...weights) + 0.5);
    const dates = samples.map((entry) => resolveDate(entry.date)?.getTime() ?? 0);
    const timeSpan = dates.at(-1)! - dates[0];
    const points = samples.map((entry, index) => ({
        x: 4 + Math.max(0, width - 8) * (timeSpan ? (dates[index] - dates[0]) / timeSpan : 0.5),
        y: 4 + (PLOT_HEIGHT - 8) * ((max - entry.weight_kg) / (max - min)),
    }));
    const diff = previous ? latest.weight_kg - previous.weight_kg : 0;

    return <View style={styles.summary}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.textPrimary }}>
            {displayNumber(latest.weight_kg)} кг
        </Text>
        <Text style={{ color: colors.textSecondary }}>
            {formatWorkoutDate(latest.date)}{previous ? ` · ${diff > 0 ? '+' : ''}${displayNumber(diff)} кг к предыдущему замеру` : ''}
        </Text>
        {entries.length > samples.length && <Text style={{ color: colors.textSecondary }}>Последние {samples.length} замеров</Text>}
        <View accessible accessibilityLabel={samples.map((entry) => `${formatWorkoutDate(entry.date)}, ${displayNumber(entry.weight_kg)} кг`).join('; ')}
            style={styles.chart}>
            <View style={styles.scale}>
                <Text style={{ color: colors.textSecondary }}>{max}</Text>
                <Text style={{ color: colors.textSecondary }}>{min}</Text>
            </View>
            <View style={styles.axis}>
                <View style={[styles.plot, { borderColor: colors.border }]} onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}>
                    {width > 0 && points.map((point, index) => {
                        const next = points[index + 1];
                        if (!next) return null;
                        const dx = next.x - point.x;
                        const dy = next.y - point.y;
                        const length = Math.hypot(dx, dy);
                        return <View key={samples[index].id} style={[styles.line, {
                            width: length, left: (point.x + next.x - length) / 2,
                            top: (point.y + next.y) / 2 - 1, backgroundColor: colors.accent,
                            transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                        }]} />;
                    })}
                    {width > 0 && points.map((point, index) => <View key={samples[index].id}
                        style={[styles.dot, { left: point.x - 3, top: point.y - 3, backgroundColor: colors.accent }]} />)}
                </View>
                {samples.length > 1 && <View style={styles.dates}>
                    <Text style={{ color: colors.textSecondary }}>{formatWorkoutDate(samples[0].date)}</Text>
                    <Text style={{ color: colors.textSecondary }}>{formatWorkoutDate(latest.date)}</Text>
                </View>}
            </View>
        </View>
    </View>;
}

const styles = StyleSheet.create({
    summary: { gap: 6 },
    chart: { flexDirection: 'row', gap: 8, marginTop: 8 },
    axis: { flex: 1, gap: 6 },
    scale: { height: PLOT_HEIGHT, justifyContent: 'space-between' },
    plot: { height: PLOT_HEIGHT, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
    line: { position: 'absolute', height: 2 },
    dot: { position: 'absolute', height: 6, width: 6, borderRadius: 3 },
    dates: { flexDirection: 'row', justifyContent: 'space-between' },
});
