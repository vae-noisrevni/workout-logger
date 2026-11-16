import { Ionicons } from '@expo/vector-icons';
import { EXERCISE_TYPE_ICONS } from '@/constants/exerciseIcons';
import { useMemo } from 'react';
import { useDataVersion } from '@/context/DataVersionContext';
import { Pressable, Text, View } from 'react-native';
import type { Exercise } from '@/types/exercise';
import type { ThemeColors } from '@/theme/colors';
import { displayNumber, valueUnit, exerciseVolume, type exerciseProgress } from '@/utils/stats';
import { getLastWorkout } from '@/db/stats';
import { monthDativeLabel, formatWorkoutDate } from '@/utils/date';

export function FavoriteStatCard({ exercise, progress, colors, onPress }: {
    exercise: Exercise; progress: ReturnType<typeof exerciseProgress>; colors: ThemeColors; onPress?: () => void;
}) {
    const { workoutsRevision } = useDataVersion();
    const last = useMemo(() => { void workoutsRevision; return getLastWorkout(exercise.id); }, [exercise.id, workoutsRevision]);
    return <Pressable onPress={onPress} style={{ padding: 16, gap: 8, borderRadius: 12,
        borderLeftWidth: 5, borderLeftColor: exercise.color, backgroundColor: colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name={EXERCISE_TYPE_ICONS[exercise.type]} size={20} color={colors.textSecondary} />
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '600', flex: 1 }}>{exercise.name}</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 24 }}>
            {progress.best === null ? 'Нет данных' : `${exercise.type === 'assisted' ? 'Помощь ' : ''}${displayNumber(progress.best)} ${valueUnit(exercise.type)}`}
        </Text>
        {progress.previous && progress.latest && <Text style={{ color: progress.improved === null ? colors.textSecondary : progress.improved ? colors.success : colors.danger }}>
            {progress.diff === 0 ? 'Без изменений' : `${progress.diff! > 0 ? '+' : ''}${displayNumber(progress.diff!)} ${valueUnit(exercise.type)}`} к {monthDativeLabel(progress.previous.month, progress.latest.month)}
        </Text>}
        {last && <Text style={{ color: colors.textSecondary }}>
            {exercise.type === 'weighted' ? 'Тоннаж' : 'Объём'}: {displayNumber(exerciseVolume(exercise.type, last.sets))} {exercise.type === 'weighted' ? 'кг' : 'повт.'} · {formatWorkoutDate(last.date)}
        </Text>}
    </Pressable>;
}
