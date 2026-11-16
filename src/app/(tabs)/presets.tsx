import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { usePresets } from '@/hooks/usePresets';
import { useExercises } from '@/hooks/useExercises';
import { archivePreset } from '@/db/presets';
import { Action, Heading, Panel } from '@/components/ScreenControls/ScreenControls';
import { PresetEditor } from '@/components/PresetEditor/PresetEditor';
import { ThemeSheet } from '@/components/ThemeSheet/ThemeSheet';
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import type { WorkoutPreset } from '@/types/presets';

export default function PresetsScreen() {
    const colors = useTheme();
    const dialog = useDialog();
    const { presets, error, refresh } = usePresets();
    const { exercises } = useExercises();
    const [editor, setEditor] = useState<{ preset?: WorkoutPreset } | null>(null);
    return <>
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Action title="Создать пресет" onPress={() => setEditor({})} />
            {error && <Text style={{ color: colors.danger }}>{error}</Text>}
            {!presets.length && <Text style={{ color: colors.textSecondary }}>Создайте план, например «Понедельник», «Среда» или «Пятница»</Text>}
            {presets.map((preset) => <Panel key={preset.id}>
                <Heading>{preset.name}</Heading>
                <Text style={{ color: colors.textSecondary }}>{preset.exercise_ids.map((id) => exercises.find((exercise) => exercise.id === id)?.name).filter(Boolean).join(' · ') || 'Добавьте упражнения — этот пресет пока нельзя запустить'}</Text>
                <Action title="Редактировать" onPress={() => setEditor({ preset })} />
                <Action title="Удалить" danger onPress={() => dialog.show({ title: 'Удалить пресет?', message: 'Он исчезнет из списка. Сохранённые тренировки останутся в истории.',
                    buttons: [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => {
                        try { archivePreset(preset.id); refresh(); }
                        catch (error) { dialog.show({ title: 'Ошибка', message: error instanceof Error ? error.message : 'Не удалось удалить' }); }
                    } }] })} />
            </Panel>)}
        </ScrollView>
        {editor && <ThemeSheet onClose={() => setEditor(null)}>
            <PresetEditor preset={editor.preset} onSaved={() => setEditor(null)} onCancel={() => setEditor(null)} />
        </ThemeSheet>}
    </>;
}
