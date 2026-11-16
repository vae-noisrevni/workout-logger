import { MonthlyActivity } from '@/components/MonthlyActivity/MonthlyActivity';
import { BodyWeightLog } from '@/components/BodyWeightLog/BodyWeightLog';
import { useBodyWeight } from '@/hooks/useBodyWeight';
import { displayNumber } from '@/utils/stats';
import { useState } from 'react';
import { SetCalculator } from '@/components/SetCalculator/SetCalculator';
import { ThemeSheet } from '@/components/ThemeSheet/ThemeSheet';
import { useExercises } from '@/hooks/useExercises';
import { ScrollView, Text } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useStats } from '@/hooks/useStats';
import { FavoriteStatCard } from '@/components/FavoriteStatCard/FavoriteStatCard';
import { MonthlyBars } from '@/components/MonthlyBars/MonthlyBars';
import { Action, Field, Heading, Panel } from '@/components/ScreenControls/ScreenControls';

export default function StatsScreen() {
    const colors = useTheme();
    const { entries } = useBodyWeight();
    const currentWeight = entries[0];
    const previousWeight = entries[1];
    const { favorites, monthly, error } = useStats();
    const { exercises } = useExercises();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [sheet, setSheet] = useState<{ kind: 'pick' } | { kind: 'calc'; id: number } | null>(null);
    const [search, setSearch] = useState('');
    const selected = exercises.find((exercise) => exercise.id === selectedId);
    const sheetExercise = sheet?.kind === 'calc' ? exercises.find((exercise) => exercise.id === sheet.id) : null;
    return <><ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {error && <Text style={{ color: colors.danger }}>{error}</Text>}
        <Heading>Избранное</Heading>
        {!favorites.length && <Link href="/exercises" style={{ color: colors.accent }}>Отметьте упражнения звёздочкой на вкладке «Упражнения»</Link>}
        {favorites.map((stat) => <FavoriteStatCard key={stat.exercise.id} {...stat} colors={colors} onPress={() => setSheet({ kind: 'calc', id: stat.exercise.id })} />)}
        <MonthlyActivity count={monthly.at(-1)?.count ?? 0}>
            <Heading>Тренировок в месяц</Heading>
            <Text style={{ color: colors.textPrimary }}>{monthly.at(-1)?.count ?? 0} в текущем месяце</Text>
            <Text style={{ color: colors.textPrimary }}>{currentWeight ? `Вес: ${displayNumber(currentWeight.weight_kg)} кг · ${currentWeight.date}` : 'Добавьте первый замер веса тела ниже'}</Text>
            {currentWeight && previousWeight && <Text style={{ color: colors.textSecondary }}>
                {currentWeight.weight_kg - previousWeight.weight_kg > 0 ? '+' : ''}{displayNumber(currentWeight.weight_kg - previousWeight.weight_kg)} кг к замеру {previousWeight.date}
            </Text>}
            <MonthlyBars data={monthly} colors={colors} />
        </MonthlyActivity>
        <BodyWeightLog />
        <Panel>
            <Heading>Калькулятор</Heading>
            <Action title={selected ? `Упражнение: ${selected.name} ▾` : 'Выбрать упражнение'} onPress={() => { setSearch(''); setSheet({ kind: 'pick' }); }} />
            {selected && <SetCalculator exercise={selected} colors={colors} />}
        </Panel>
    </ScrollView>
    {sheet && <ThemeSheet onClose={() => setSheet(null)}>
        {sheet.kind === 'calc' && sheetExercise && <SetCalculator exercise={sheetExercise} colors={colors} />}
        {sheet.kind === 'pick' && <>
            <Field label="Поиск упражнения" value={search} onChangeText={setSearch} />
            {exercises.filter((exercise) => exercise.name.toLowerCase().includes(search.trim().toLowerCase())).map((exercise) =>
                <Action key={exercise.id} title={exercise.name} onPress={() => { setSelectedId(exercise.id); setSheet(null); }} />)}
            {!exercises.length && <Text style={{ color: colors.textSecondary }}>Сначала добавьте упражнения в справочник</Text>}
        </>}
    </ThemeSheet>}
    </>;
}
