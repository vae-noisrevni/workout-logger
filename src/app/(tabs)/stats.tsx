import {TransferControls} from '@/components/TransferControls/TransferControls';
import { Panel } from '@/components/ScreenControls/ScreenControls';
import { formatWorkoutDate } from '@/utils/date';
import { MonthlyActivity } from '@/components/MonthlyActivity/MonthlyActivity';
import { BodyWeightLog } from '@/components/BodyWeightLog/BodyWeightLog';
import { useBodyWeight } from '@/hooks/useBodyWeight';
import { displayNumber } from '@/utils/stats';
import { ScrollView, Text } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useStats } from '@/hooks/useStats';
import { FavoriteStatCard } from '@/components/FavoriteStatCard/FavoriteStatCard';
import { MonthlyBars } from '@/components/MonthlyBars/MonthlyBars';
import { Heading } from '@/components/ScreenControls/ScreenControls';

export default function StatsScreen() {
    const colors = useTheme();
    const { entries } = useBodyWeight();
    const currentWeight = entries[0];
    const previousWeight = entries[1];
    const { favorites, monthly, error } = useStats();
    return <><ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {error && <Text style={{ color: colors.danger }}>{error}</Text>}
        <Heading>Избранное</Heading>
        {!favorites.length && <Link href="/exercises" style={{ color: colors.accent }}>Отметьте упражнения звёздочкой на вкладке «Упражнения»</Link>}
        {favorites.map((stat) => <FavoriteStatCard key={stat.exercise.id} {...stat} colors={colors} />)}
        <MonthlyActivity count={monthly.at(-1)?.count ?? 0}>
            <Heading>Тренировок в месяц</Heading>
            <Text style={{ color: colors.textPrimary }}>{monthly.at(-1)?.count ?? 0} в текущем месяце</Text>
            <Text style={{ color: colors.textPrimary }}>{currentWeight ? `Вес: ${displayNumber(currentWeight.weight_kg)} кг · ${formatWorkoutDate(currentWeight.date)}` : 'Добавьте первый замер веса тела ниже'}</Text>
            {currentWeight && previousWeight && <Text style={{ color: colors.textSecondary }}>
                {currentWeight.weight_kg - previousWeight.weight_kg > 0 ? '+' : ''}{displayNumber(currentWeight.weight_kg - previousWeight.weight_kg)} кг к замеру {formatWorkoutDate(previousWeight.date)}
            </Text>}
            <MonthlyBars data={monthly} colors={colors} />
        </MonthlyActivity>
        <BodyWeightLog />
        <Panel><Heading>Все данные</Heading><TransferControls mode="all"/></Panel>
    </ScrollView></>;
}
