import { Field } from '@/components/ScreenControls/ScreenControls';
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import { SetCalculator } from '@/components/SetCalculator/SetCalculator';
import { DEFAULT_SET } from '@/hooks/useWorkoutDraft';
import type { SetLike } from '@/utils/stats';
import { useDataVersion } from '@/context/DataVersionContext';
import { setExerciseWeightUnit } from '@/db/exercises';
import { fromKilograms, toKilograms } from '@/utils/weight';
// src/components/SetsSheet/SetsSheet.tsx
import { getLastWorkout } from '@/db/stats';
import { bestSet, displayNumber } from '@/utils/stats';
import { formatWorkoutDate } from '@/utils/date';
import { NumberStepperField } from '@/components/NumberStepperField/NumberStepperField';
import { EXERCISE_TYPE_ICONS } from '@/constants/exerciseIcons';
import type { ThemeColors } from '@/theme/colors';
import { EXERCISE_TYPE_LABELS } from '@/types/exercise';
import type { ResolvedDraftExercise } from '@/utils/resolveDraft';
import BottomSheet, {
    BottomSheetScrollView,
} from '@expo/ui/community/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface SetsSheetRef {
    /** Открыть sheet для упражнения по id. Объект ищется в актуальном draft. */
    open: (exerciseId: number) => void;
    close: () => void;
}

interface Props {
    colors: ThemeColors;
    excludeWorkoutId?: number;
    onUpdateExerciseComment: (exerciseId: number, comment: string) => void;
    onReplaceSets: (exerciseId: number, sets: SetLike[]) => void;
    draft: ResolvedDraftExercise[];
    onAddSet: (exerciseId: number) => void;
    onUpdateSet: (
        exerciseId: number,
        setId: string,
        patch: { reps?: number; weight?: number },
    ) => void;
    onRemoveSet: (exerciseId: number, setId: string) => void;
}

export const SetsSheet = forwardRef<SetsSheetRef, Props>(
    ({ colors, draft, onAddSet, onUpdateSet, onRemoveSet, excludeWorkoutId, onReplaceSets, onUpdateExerciseComment }, ref) => {
        const dialog = useDialog();
        const [calculatorOpen, setCalculatorOpen] = useState(false);
        const { bumpExercises, workoutsRevision } = useDataVersion();
        const sheetRef = useRef<BottomSheet>(null);
        const [openId, setOpenId] = useState<number | null>(null);

        useImperativeHandle(ref, () => ({
            open: (exerciseId) => {
                setCalculatorOpen(false);
                setOpenId(exerciseId);
                requestAnimationFrame(() => sheetRef.current?.present());
            },
            close: () => sheetRef.current?.close(),
        }));

        const exercise =
            openId !== null
                ? (draft.find((d) => d.exercise_id === openId) ?? null)
                : null;

        const exerciseId = exercise?.exercise_id;
        const last = useMemo(() => {
            void workoutsRevision;
            return exerciseId === undefined ? null : getLastWorkout(exerciseId, excludeWorkoutId);
        }, [exerciseId, excludeWorkoutId, workoutsRevision]);
        if (!exercise) return null;

        const previous = last ? bestSet(exercise.type, last.sets) : null;
        const isBodyweight = exercise.type === 'bodyweight';

        return (
            <BottomSheet
                ref={sheetRef}
                key={openId}
                snapPoints={['60%', '90%']}
                index={0}
                enablePanDownToClose
                onClose={() => setOpenId(null)}
                backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
            >
                <BottomSheetScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View
                            style={[
                                styles.colorDot,
                                { backgroundColor: exercise.color },
                            ]}
                        />
                        <View style={{ flex: 1 }}>
                            <View style={styles.nameRow}>
                                <Ionicons
                                    name={EXERCISE_TYPE_ICONS[exercise.type]}
                                    size={18}
                                    color={colors.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.name,
                                        { color: colors.textPrimary },
                                    ]}
                                >
                                    {exercise.name}
                                </Text>
                            </View>
                            <Text
                                style={[
                                    styles.type,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                {EXERCISE_TYPE_LABELS[exercise.type]}
                            </Text>
                        </View>
                    </View>

                    <Text style={{ color: colors.textSecondary }}>
                        {previous && last
                            ? `Прошлая тренировка (${formatWorkoutDate(last.date)}): ${isBodyweight ? '' : `${exercise.type === 'assisted' ? 'помощь ' : ''}${displayNumber(previous.weight)} кг × `}${previous.reps} повт.`
                            : 'Предыдущих результатов нет'}
                    </Text>
                    {!isBodyweight && <View style={{ flexDirection: 'row', gap: 12 }}>
                        {(['kg', 'lb'] as const).map((unit) => <Pressable key={unit}
                            accessibilityRole="radio" accessibilityState={{ selected: exercise.weight_unit === unit }}
                            onPress={() => {
                                try { setExerciseWeightUnit(exercise.exercise_id, unit); bumpExercises(); }
                                catch (error) { dialog.show({ title: 'Ошибка', message: error instanceof Error ? error.message : 'Не удалось сохранить единицу веса' }); }
                            }}
                            style={{ padding: 12, borderRadius: 10, backgroundColor: exercise.weight_unit === unit ? colors.accent : colors.surface }}>
                            <Text style={{ color: exercise.weight_unit === unit ? colors.textInverse : colors.textPrimary }}>{unit === 'kg' ? 'кг' : 'lb'}</Text>
                        </Pressable>)}
                    </View>}
                    <Pressable onPress={() => setCalculatorOpen(!calculatorOpen)} style={{ paddingVertical: 12 }}>
                        <Text style={{ color: colors.accent }}>Рассчитать подходы {calculatorOpen ? '▴' : '▾'}</Text>
                    </Pressable>
                    {calculatorOpen && <SetCalculator exercise={{ id: exercise.exercise_id, name: exercise.name, type: exercise.type }}
                        colors={colors} excludeWorkoutId={excludeWorkoutId} onApply={(sets) => {
                            const apply = () => { onReplaceSets(exercise.exercise_id, sets); setCalculatorOpen(false); };
                            const empty = !exercise.sets.length || (exercise.sets.length === 1 &&
                                exercise.sets[0].reps === DEFAULT_SET.reps && exercise.sets[0].weight === DEFAULT_SET.weight);
                            if (empty) apply();
                            else dialog.show({ title: 'Заменить подходы?', message: `Сейчас ${exercise.sets.length} подх. — они будут заменены расчётом`,
                                buttons: [{ text: 'Отмена', style: 'cancel' }, { text: 'Заменить', style: 'destructive', onPress: apply }] });
                        }} />}
                    <Field label="Комментарий к упражнению в этой тренировке" multiline
                        value={exercise.comment ?? ''} onChangeText={(comment) => onUpdateExerciseComment(exercise.exercise_id, comment)} />
                    <View style={styles.setsList}>
                        {exercise.sets.map((set, index) => (
                            <View
                                key={set.id}
                                style={[
                                    styles.setRow,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.setIndex,
                                        { color: colors.textSecondary },
                                    ]}
                                >
                                    {index + 1}
                                </Text>

                                <NumberStepperField
                                    label="Повторения"
                                    value={set.reps}
                                    colors={colors}
                                    onChange={(reps) =>
                                        onUpdateSet(
                                            exercise.exercise_id,
                                            set.id,
                                            { reps },
                                        )
                                    }
                                />

                                {!isBodyweight && (
                                    <NumberStepperField
                                        key={exercise.weight_unit}
                                        label={`${exercise.type === 'assisted' ? 'Помощь' : 'Вес'} (${exercise.weight_unit === 'lb' ? 'lb' : 'кг'})`}
                                        value={fromKilograms(set.weight, exercise.weight_unit)}
                                        step={2.5}
                                        decimal
                                        colors={colors}
                                        onChange={(weight) =>
                                            onUpdateSet(
                                                exercise.exercise_id,
                                                set.id,
                                                { weight: toKilograms(weight, exercise.weight_unit) },
                                            )
                                        }
                                    />
                                )}

                                {!isBodyweight && exercise.weight_unit === 'lb' && <Text style={{ color: colors.textSecondary }}>
                                    {displayNumber(set.weight)} кг
                                </Text>}
                                {exercise.sets.length > 0 && (
                                    <Pressable
                                        onPress={() =>
                                            onRemoveSet(
                                                exercise.exercise_id,
                                                set.id,
                                            )
                                        }
                                        hitSlop={10}
                                        style={styles.removeButton}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={20}
                                            color={colors.danger}
                                        />
                                    </Pressable>
                                )}
                            </View>
                        ))}
                    </View>

                    <Pressable
                        onPress={() => onAddSet(exercise.exercise_id)}
                        style={[
                            styles.addSetButton,
                            { borderColor: colors.accent },
                        ]}
                    >
                        <Ionicons name="add" size={22} color={colors.accent} />
                        <Text
                            style={{ color: colors.accent, fontWeight: '600' }}
                        >
                            Добавить подход
                        </Text>
                    </Pressable>
                </BottomSheetScrollView>
            </BottomSheet>
        );
    },
);

SetsSheet.displayName = 'SetsSheet';

const styles = StyleSheet.create({
    content: { padding: 20, gap: 16 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    colorDot: { width: 12, height: 12, borderRadius: 6 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontSize: 20, fontWeight: '700' },
    type: { fontSize: 13, marginTop: 2 },
    setsList: { gap: 10 },
    setRow: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    setIndex: {
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'left',
        marginBottom: 0,
    },
    removeButton: { alignSelf: 'flex-end', padding: 10 },
    addSetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
});
