import { useState } from 'react';
import { Text, View } from 'react-native';
import { useExercises } from '@/hooks/useExercises';
import { useDataVersion } from '@/context/DataVersionContext';
import { useTheme } from '@/theme/ThemeContext';
import { savePreset } from '@/db/presets';
import type { WorkoutPreset } from '@/types/presets';
import { Action, Field, Heading } from '@/components/ScreenControls/ScreenControls';

export function PresetEditor({ preset, initialIds = [], onSaved, onCancel }: {
    preset?: WorkoutPreset; initialIds?: number[]; onSaved: () => void; onCancel: () => void;
}) {
    const colors = useTheme();
    const { exercises } = useExercises();
    const { bumpPresets } = useDataVersion();
    const [name, setName] = useState(preset?.name ?? '');
    const [ids, setIds] = useState(preset?.exercise_ids ?? initialIds);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const availableIds = ids.filter((id) => exercises.some((exercise) => exercise.id === id));
    const move = (index: number, direction: number) => {
        const next = [...availableIds];
        [next[index], next[index + direction]] = [next[index + direction], next[index]];
        setIds(next);
    };
    const save = () => {
        try { savePreset(name, availableIds, preset?.id); bumpPresets(); onSaved(); }
        catch (error) { setError(error instanceof Error ? error.message : 'Не удалось сохранить пресет'); }
    };
    return <View style={{ gap: 12 }}>
        <Heading>{preset ? 'Редактировать пресет' : 'Новый пресет'}</Heading>
        <Field label="Название пресета" placeholder="Например, Понедельник" value={name} onChangeText={setName} />
        {availableIds.map((id, index) => <View key={id} style={{ gap: 6, paddingVertical: 6 }}>
            <Text style={{ color: colors.textPrimary }}>{index + 1}. {exercises.find((exercise) => exercise.id === id)?.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Action title="Выше" disabled={index === 0} onPress={() => move(index, -1)} />
                <Action title="Ниже" disabled={index === availableIds.length - 1} onPress={() => move(index, 1)} />
                <Action title="Убрать" onPress={() => setIds(availableIds.filter((value) => value !== id))} />
            </View>
        </View>)}
        <Field label="Добавить упражнение — поиск" value={search} onChangeText={setSearch} />
        {exercises.filter((exercise) => !availableIds.includes(exercise.id) && exercise.name.toLowerCase().includes(search.trim().toLowerCase()))
            .map((exercise) => <Action key={exercise.id} title={`+ ${exercise.name}`} onPress={() => setIds([...availableIds, exercise.id])} />)}
        {!exercises.length && <Text style={{ color: colors.textSecondary }}>Сначала добавьте упражнения в справочник</Text>}
        {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}
        <Action title="Сохранить пресет" disabled={!name.trim() || !availableIds.length} onPress={save} />
        <Action title="Отмена" onPress={onCancel} />
    </View>;
}
