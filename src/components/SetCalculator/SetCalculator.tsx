import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Exercise } from '@/types/exercise';
import type { ThemeColors } from '@/theme/colors';
import { getLastWorkoutSets } from '@/db/stats';
import { GOALS, calculatePlan, pickWorkingSet, planToSets, type Goal } from '@/utils/calculator';
import { displayNumber, type SetLike } from '@/utils/stats';
import { NumberStepperField } from '@/components/NumberStepperField/NumberStepperField';
import { Action } from '@/components/ScreenControls/ScreenControls';
import { useDataVersion } from '@/context/DataVersionContext';

type Props = { exercise: Pick<Exercise, 'id' | 'name' | 'type'>; colors: ThemeColors;
    excludeWorkoutId?: number; onApply?: (sets: SetLike[]) => void };
export function SetCalculator(props: Props) {
    const { workoutsRevision } = useDataVersion();
    return <CalculatorForm key={`${props.exercise.id}-${props.exercise.type}-${workoutsRevision}-${props.excludeWorkoutId}`} {...props} />;
}
function CalculatorForm({ exercise, colors, excludeWorkoutId, onApply }: Props) {
    const [initial] = useState(() => pickWorkingSet(exercise.type, getLastWorkoutSets(exercise.id, excludeWorkoutId)));
    const [weight, setWeight] = useState(initial?.weight ?? 0);
    const [reps, setReps] = useState(initial?.reps ?? 0);
    const [goal, setGoal] = useState<Goal>('hypertrophy');
    const plan = calculatePlan(exercise.type, { weight, reps }, goal);
    return <View style={{ gap: 12 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{exercise.name}</Text>
        {!initial && <Text style={{ color: colors.textSecondary }}>Нет истории — введите рабочий подход</Text>}
        {exercise.type !== 'bodyweight' && <NumberStepperField label={exercise.type === 'assisted' ? 'Помощь (кг)' : 'Вес (кг)'} value={weight} onChange={setWeight} colors={colors} step={2.5} decimal />}
        <NumberStepperField label="Повторения" value={reps} onChange={setReps} colors={colors} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(GOALS) as Goal[]).map((value) => <Action key={value} selected={goal === value} title={GOALS[value].label} onPress={() => setGoal(value)} />)}
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 20 }}>
            {plan ? `${plan.sets} × ${plan.reps}${exercise.type === 'bodyweight' ? '' : `${exercise.type === 'assisted' ? ', помощь ' : ' × '}${displayNumber(plan.weight)} кг`}` : 'Введите рабочий вес и повторы'}
        </Text>
        {exercise.type !== 'weighted' && <Text style={{ color: colors.textSecondary }}>Ориентировочный расчёт по рабочему подходу</Text>}
        {onApply && plan && <Action title="Применить" onPress={() => onApply(planToSets(plan))} />}
    </View>;
}
