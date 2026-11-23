import { bodyFonts } from '@/theme/typography';
import { Text } from '@/components/Typography/Typography';
import {TransferControls} from '@/components/TransferControls/TransferControls';
import { Heading, Panel } from '@/components/ScreenControls/ScreenControls';
import { MonthlyActivity } from '@/components/MonthlyActivity/MonthlyActivity';
import { BodyWeightLog } from '@/components/BodyWeightLog/BodyWeightLog';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useStats } from '@/hooks/useStats';
import { FavoriteStatCard } from '@/components/FavoriteStatCard/FavoriteStatCard';
import { MonthlyBars } from '@/components/MonthlyBars/MonthlyBars';

export default function StatsScreen() {
    const colors = useTheme();
    const { width } = useWindowDimensions();
    const { favorites, monthly, error } = useStats();
    return <><ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <BodyWeightLog />
        {error && <Text style={{ color: colors.danger }}>{error}</Text>}
        <Heading>Избранное</Heading>
        {!favorites.length && <Link href="/exercises" style={{ color: colors.accent, fontFamily: bodyFonts.regular }}>Отметьте упражнения сердечком на вкладке «Упражнения»</Link>}
        {!!favorites.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'stretch', gap: 12 }}>
            {favorites.map((stat) => <View key={stat.exercise.id} style={{ width: Math.min(296, width - 64) }}>
                <FavoriteStatCard {...stat} colors={colors} />
            </View>)}
        </ScrollView>}
        <MonthlyActivity count={monthly.at(-1)?.count ?? 0}>
            <Heading>Тренировок в месяц</Heading>
            <Text style={{ color: colors.textPrimary }}>{monthly.at(-1)?.count ?? 0} в текущем месяце</Text>
            <MonthlyBars data={monthly} colors={colors} />
        </MonthlyActivity>
        <Panel><Heading>Все данные</Heading><TransferControls mode="all"/></Panel>
    </ScrollView></>;
}
