import { Text, View } from 'react-native';
import type { ThemeColors } from '@/theme/colors';
import type { MonthCount } from '@/utils/stats';
import { monthShortLabel } from '@/utils/date';

export function MonthlyBars({ data, colors }: { data: MonthCount[]; colors: ThemeColors }) {
    const max = Math.max(1, ...data.map((item) => item.count));
    return <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
            {data.map((item, index) => <View key={item.month} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 10 }}>{item.count}</Text>
                <View style={{ height: 120, justifyContent: 'flex-end', width: '100%' }}>
                    <View style={{ height: item.count ? Math.max(2, item.count / max * 120) : 0,
                        borderRadius: 3, backgroundColor: index === data.length - 1 ? colors.accent : colors.accentMuted }} />
                </View>
                <Text style={{ fontSize: 10, color: colors.textSecondary }}>{monthShortLabel(item.month)}</Text>
            </View>)}
        </View>
        {!data.some((item) => item.count) && <Text style={{ color: colors.textSecondary }}>Пока нет тренировок</Text>}
    </View>;
}
