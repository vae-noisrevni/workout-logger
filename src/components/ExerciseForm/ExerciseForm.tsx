import { Text } from '@/components/Typography/Typography';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
import { Field } from '@/components/ScreenControls/ScreenControls';
import { headingFont } from '@/theme/typography';
// src/components/ExerciseForm/ExerciseForm.tsx
import {
    DEFAULT_EXERCISE_COLOR,
    EXERCISE_COLORS,
} from '@/constants/exerciseColors';
import type { ThemeColors } from '@/theme/colors';
import {
    CreateExerciseInput,
    Exercise,
    EXERCISE_TYPE_LABELS,
    ExerciseType,
} from '@/types/exercise';
import { BottomSheetScrollView } from '@expo/ui/community/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

type Mode = { type: 'create' } | { type: 'edit'; exercise: Exercise };

interface Props {
    mode: Mode;
    colors: ThemeColors;
    onSubmit: (data: CreateExerciseInput) => void;
    onCancel: () => void;
    pending?: boolean;
}

export function ExerciseForm({ mode, colors, onSubmit, onCancel, pending }: Props) {
    const initial = mode.type === 'edit' ? mode.exercise : null;
    const [name, setName] = useState(initial?.name ?? '');
    const [type, setType] = useState<ExerciseType>(initial?.type ?? 'weighted');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [color, setColor] = useState<string>(
        initial?.color ?? DEFAULT_EXERCISE_COLOR,
    );

    const [isFavorite, setIsFavorite] = useState(initial?.is_favorite ?? false);

    const isValid = name.trim().length > 0;

    return (
        <BottomSheetScrollView nestedScrollEnabled contentContainerStyle={styles.form}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
                {mode.type === 'create' ? 'Новое упражнение' : 'Редактировать'}
            </Text>

            <Field label="Название упражнения" value={name} onChangeText={setName} autoFocus />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
                Тип
            </Text>
            <View style={styles.typeRow}>
                {(Object.keys(EXERCISE_TYPE_LABELS) as ExerciseType[]).map(
                    (t) => (
                        <ScalePressable
                            key={t}
                            onPress={() => setType(t)}
                            style={[
                                styles.typeChip,
                                {
                                    backgroundColor:
                                        type === t
                                            ? colors.accent
                                            : colors.surface,
                                    borderColor:
                                        type === t
                                            ? colors.accent
                                            : colors.border,
                                },
                            ]}
                        >
                            <Text
                                style={{
                                    color:
                                        type === t
                                            ? colors.textInverse
                                            : colors.textPrimary,
                                    fontSize: 13,
                                }}
                            >
                                {EXERCISE_TYPE_LABELS[t]}
                            </Text>
                        </ScalePressable>
                    ),
                )}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
                Цвет
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorRow}
            >
                {EXERCISE_COLORS.map((c) => {
                    const selected = c === color;
                    return (
                        <ScalePressable
                            key={c}
                            onPress={() => setColor(c)}
                            style={[
                                styles.colorCircle,
                                {
                                    backgroundColor: c,
                                    borderColor: selected
                                        ? colors.textPrimary
                                        : 'transparent',
                                },
                            ]}
                            hitSlop={6}
                        >
                            {selected && (
                                <Ionicons
                                    name="checkmark"
                                    size={22}
                                    color="#151517"
                                />
                            )}
                        </ScalePressable>
                    );
                })}
            </ScrollView>

            <Field label="Описание" value={description} onChangeText={setDescription}
                placeholder="Ссылка на видео или текстовое описание" multiline />

            <ScalePressable pressedScale={0.90} onPress={() => setIsFavorite(!isFavorite)} accessibilityRole="checkbox" accessibilityState={{ checked: isFavorite }} style={styles.typeRow}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={colors.favorite} />
                <Text style={{ color: colors.textPrimary }}>Избранное</Text>
            </ScalePressable>
            <View style={styles.actions}>
                <ScalePressable
                    onPress={onCancel}
                    style={[
                        styles.button,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderWidth: 1,
                        },
                    ]}
                >
                    <Text style={{ color: colors.textPrimary }}>Отмена</Text>
                </ScalePressable>
                <ScalePressable
                    onPress={() =>
                        isValid &&
                        onSubmit({
                            name: name.trim(),
                            type,
                            description: description.trim(),
                            color,
                            is_favorite: isFavorite,
                        })
                    }
                    disabled={!isValid || pending}
                    style={[
                        styles.button,
                        {
                            backgroundColor: isValid
                                ? colors.accent
                                : colors.border,
                        },
                    ]}
                >
                    <Text
                        style={{ color: colors.textInverse, fontWeight: '600' }}
                    >
                        Сохранить
                    </Text>
                </ScalePressable>
            </View>
        </BottomSheetScrollView>
    );
}

const styles = StyleSheet.create({
    form: { padding: 24, gap: 12 },
    title: { fontSize: 21, fontFamily: headingFont, marginBottom: 8 },
    label: { fontSize: 13, marginTop: 8, marginBottom: 4 },
    typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    typeChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    colorRow: { gap: 12, paddingVertical: 4, paddingHorizontal: 2 },
    colorCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    button: { flex: 1, minHeight: 48, padding: 12, borderRadius: 14, alignItems: 'center' },
});
