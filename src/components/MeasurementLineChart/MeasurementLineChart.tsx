import { Text } from '@/components/Typography/Typography';
import type { ThemeColors } from '@/theme/colors';
import { formatWorkoutDate, resolveDate } from '@/utils/date';
import { displayNumber } from '@/utils/stats';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const HEIGHT = 100;

export function MeasurementLineChart({ samples, unit, colors }: {
    samples: { id: number; date: string; value: number }[];
    unit: string;
    colors: ThemeColors;
}) {
    const [width, setWidth] = useState(0);
    if (samples.length < 2) return null;
    const values = samples.map(({ value }) => value);
    const min = Math.floor(Math.min(...values) - 0.5);
    const max = Math.ceil(Math.max(...values) + 0.5);
    const dates = samples.map(({ date }) => resolveDate(date)?.getTime() ?? 0);
    const timeSpan = dates.at(-1)! - dates[0];
    const points = samples.map(({ value }, index) => ({
        x: 4 + Math.max(0, width - 8) * (timeSpan ? (dates[index] - dates[0]) / timeSpan : index / (samples.length - 1)),
        y: 4 + (HEIGHT - 8) * (max - value) / (max - min),
    }));
    const first = samples[0];
    const last = samples.at(-1)!;
    const chartLabel = `График: ${samples.length} значений. ${formatWorkoutDate(first.date)}: ${displayNumber(first.value)} ${unit}. ${formatWorkoutDate(last.date)}: ${displayNumber(last.value)} ${unit}.`;

    return <View accessible accessibilityLabel={chartLabel} style={styles.chart}>
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
            <View style={styles.dates}>
                <Text style={{ color: colors.textSecondary }}>{formatWorkoutDate(first.date)}</Text>
                <Text style={{ color: colors.textSecondary }}>{formatWorkoutDate(last.date)}</Text>
            </View>
        </View>
    </View>;
}

const styles = StyleSheet.create({
    chart: { flexDirection: 'row', gap: 8, marginTop: 8 },
    axis: { flex: 1, gap: 6 },
    scale: { height: HEIGHT, justifyContent: 'space-between' },
    plot: { height: HEIGHT, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
    line: { position: 'absolute', height: 2 },
    dot: { position: 'absolute', height: 6, width: 6, borderRadius: 3 },
    dates: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8 },
});
