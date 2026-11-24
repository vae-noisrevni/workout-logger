import { Text } from '@/components/Typography/Typography';
import { WeightValue } from '@/components/WeightValue/WeightValue';
import { Ionicons } from '@expo/vector-icons';
import { EXERCISE_TYPE_ICONS } from '@/constants/exerciseIcons';
import { useLastResult } from '@/hooks/useDataQueries';
import { Pressable, View } from 'react-native';
import type { Exercise } from '@/types/exercise';
import type { ThemeColors } from '@/theme/colors';
import { displayNumber, valueUnit, exerciseVolume, additionalVolume, type exerciseProgress } from '@/utils/stats';
import { monthDativeLabel, formatWorkoutDate } from '@/utils/date';

export function FavoriteStatCard({ exercise, progress, colors, onPress }: {
    exercise: Exercise; progress: ReturnType<typeof exerciseProgress>; colors: ThemeColors; onPress?: () => void;
}) {
    const last = useLastResult(exercise.id);
    return <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={{ flexGrow: 1, padding: 16, gap: 8, borderRadius: 12,
        borderLeftWidth: 5, borderLeftColor: exercise.color, backgroundColor: colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name={EXERCISE_TYPE_ICONS[exercise.type]} size={20} color={colors.textSecondary} />
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '600', flex: 1 }}>{exercise.name}</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 24 }}>
            {progress.best === null ? 'Нет данных' : <>{exercise.type === 'assisted' ? 'Помощь ' : ''}<WeightValue value={progress.best}/>{exercise.type === 'bodyweight' ? ` × ${progress.bestApproach?.reps} повт.` : ''}</>}
        </Text>
        {progress.previous && progress.latest && <Text style={{ color: progress.improved === null ? colors.textSecondary : progress.improved ? colors.success : colors.danger }}>
            {progress.diff === 0 ? (progress.repsDiff ? `${progress.repsDiff > 0 ? '+' : ''}${progress.repsDiff} повт.` : 'Без изменений') : `${progress.diff! > 0 ? '+' : ''}${displayNumber(progress.diff!)} ${valueUnit(exercise.type)}`} к {monthDativeLabel(progress.previous.month, progress.latest.month)}
        </Text>}
        {last && <View style={{ gap: 4 }}>
            <Text style={{ color: colors.textPrimary }}>
                {exercise.type === 'weighted' ? 'Тоннаж' : 'Объём'}: {displayNumber(exerciseVolume(exercise.type, last.sets))} {exercise.type === 'weighted' ? 'кг' : 'повт.'}{exercise.type === 'bodyweight' ? ` · ${displayNumber(additionalVolume(last.sets))} кг дополнительной нагрузки` : ''}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatWorkoutDate(last.date)}</Text>
        </View>}
    </Pressable>;
}
