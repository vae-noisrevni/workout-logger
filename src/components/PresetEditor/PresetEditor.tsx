import { Text } from '@/components/Typography/Typography';
import { SearchField } from '@/components/SearchField/SearchField';
import { headingFont } from '@/theme/typography';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useExercises } from '@/hooks/useExercises';
import { usePresets } from '@/hooks/usePresets';
import { useTheme } from '@/theme/ThemeContext';
import { SetEditor } from '@/components/SetEditor/SetEditor';
import { ExerciseSquare } from '@/components/ExerciseSquare/ExerciseSquare';
import { ReorderableExerciseList } from '@/components/ReorderableExerciseList/ReorderableExerciseList';
import { Action, Field } from '@/components/ScreenControls/ScreenControls';
import { moveDraftExercise } from '@/utils/draft';
import type { WorkoutPreset, PresetExercise } from '@/types/presets';

export function PresetEditor({ preset, initialExercises = [], onSaved, onCancel }: {
    preset?: WorkoutPreset;
    initialExercises?: PresetExercise[];
    onSaved: () => void;
    onCancel: () => void;
}) {
    const colors = useTheme();
    const { allExercises, loading } = useExercises();
    const { save, pending } = usePresets();
    const [name, setName] = useState(preset?.name ?? '');
    const [plan, setPlan] = useState<PresetExercise[]>(preset?.exercises ?? initialExercises);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const exercisesById = useMemo(() => new Map(allExercises.map((exercise) => [exercise.id, exercise])), [allExercises]);
    const items = useMemo(() => plan.flatMap((entry) => {
        const exercise = exercisesById.get(entry.exercise_id);
        return exercise ? [{ ...entry, exercise }] : [];
    }), [plan, exercisesById]);
    const query = search.trim().toLowerCase();
    const savePreset = async () => {
        const exercises = items.map(({ exercise_id, sets }) => ({ exercise_id, sets }));
        const unchanged = preset && name.trim() === preset.name.trim() &&
            exercises.length === preset.exercises.length &&
            exercises.every((entry, index) => {
                const original = preset.exercises[index];
                return entry.exercise_id === original.exercise_id && entry.sets.length === original.sets.length &&
                    entry.sets.every((set, setIndex) =>
                        set.reps === original.sets[setIndex].reps && set.weight === original.sets[setIndex].weight);
            });
        if (unchanged) {
            onSaved();
            return;
        }
        try {
            await save({ id: preset?.id, name: name.trim(), exercises });
            onSaved();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Не удалось сохранить');
        }
    };

    return <GestureHandlerRootView style={styles.root}>
        <ReorderableExerciseList
            items={items}
            onMove={(id, targetId) => setPlan((current) => moveDraftExercise(current, id, targetId))}
            handleColor={colors.textSecondary}
            disabled={pending}
            nestedScrollEnabled
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            header={<View style={styles.header}>
                <Field label={preset ? 'Название пресета' : 'Новый пресет'}
                    value={name} onChangeText={setName} selectTextOnFocus style={styles.name} />
                <SearchField value={search} onChangeText={setSearch} placeholder="Поиск упражнений" />
                <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} style={styles.catalog}>
                    {allExercises.filter((exercise) => exercise.name.toLowerCase().includes(query)).map((exercise) =>
                        <ExerciseSquare key={exercise.id} exercise={exercise} colors={colors}
                            onPress={() => setPlan((current) => current.some((entry) => entry.exercise_id === exercise.id)
                                ? current : [...current, { exercise_id: exercise.id, sets: [] }])} />)}
                </ScrollView>
            </View>}
            renderItem={({ exercise_id, exercise, sets }, dragHandle) =>
                <View style={[styles.exercise, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border }]}>
                    <View style={styles.exerciseHeader}>
                        {dragHandle}
                        <Text style={[styles.exerciseTitle, { color: colors.textPrimary }]}>{exercise.name}</Text>
                        <Pressable accessibilityLabel={`Убрать упражнение ${exercise.name}`} accessibilityRole="button"
                            disabled={pending} style={styles.remove}
                            onPress={() => setPlan((current) => current.filter((entry) => entry.exercise_id !== exercise_id))}>
                            <Ionicons name="close-circle-outline" size={22} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                    <SetEditor type={exercise.type} sets={sets} onChange={(next) =>
                        setPlan((current) => current.map((entry) => entry.exercise_id === exercise_id ? { ...entry, sets: next } : entry))} />
                </View>}
            footer={<View style={styles.footer}>
                {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}
                <View style={styles.actions}>
                    <Action title="Сохранить пресет" grow selected disabled={pending || loading || !name.trim() || !items.length} onPress={savePreset} />
                    <Action title="Отмена" grow disabled={pending} onPress={onCancel} />
                </View>
            </View>}
        />
    </GestureHandlerRootView>;
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
    header: { gap: 16, paddingBottom: 12 },
    footer: { marginTop: 'auto', paddingTop: 16, gap: 8 },
    name: { fontSize: 18, fontFamily: headingFont },
    catalog: { flexGrow: 0 },
    exercise: { borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 8 },
    exerciseHeader: { flexDirection: 'row', alignItems: 'center' },
    exerciseTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
    remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    actions: { flexDirection: 'row', gap: 8 },
});
