import { primaryButton } from '@/theme/primaryButton';
import { Text } from '@/components/Typography/Typography';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
import { Field } from "@/components/ScreenControls/ScreenControls";
import { headingFont } from "@/theme/typography";
import { DateField } from '@/components/DateField/DateField';
// src/components/FinishWorkoutSheet/FinishWorkoutSheet.tsx
import type { ThemeColors } from "@/theme/colors";
import {
  defaultWorkoutName,
  inputDateToIso,
  isoToInputDate,
  todayInputDate,
  yesterdayInputDate,
} from "@/utils/date";
import { ThemeSheet } from "@/components/ThemeSheet/ThemeSheet";
import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

export interface FinishWorkoutSheetRef {
  open: () => void;
  close: () => void;
}

export interface FinishWorkoutData {
  name: string;
  date: string; // ISO
  comment: string;
}

interface Props {
  colors: ThemeColors;
  /** Сколько упражнений в текущем draft — для заголовка и подсказки */
  exerciseCount: number;
  /** Данные редактируемой тренировки из истории; если заданы, форма работает в режиме сохранения изменений */
  initial?: FinishWorkoutData | null;
  /** Коллбэк при подтверждении. Возвращает данные формы. */
  pending?: boolean;
  onConfirm: (data: FinishWorkoutData) => Promise<boolean>;
}

export const FinishWorkoutSheet = forwardRef<FinishWorkoutSheetRef, Props>(
  ({ colors, exerciseCount, initial, onConfirm, pending }, ref) => {
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState("");
    const [dateInput, setDateInput] = useState("");
    const [comment, setComment] = useState("");
    const [dateError, setDateError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        setName(initial?.name ?? defaultWorkoutName());
        setDateInput(initial ? isoToInputDate(initial.date) : todayInputDate());
        setComment(initial?.comment ?? "");
        setDateError(null);
        setVisible(true);
      },
      close: () => setVisible(false),
    }));

    const handleConfirm = async () => {
      const iso = inputDateToIso(dateInput);
      if (!iso) {
        setDateError("Укажите существующую дату в формате ДД.ММ.ГГГГ");
        return;
      }
      const trimmedName = name.trim() || defaultWorkoutName();
      const saved = await onConfirm({
        name: trimmedName,
        date: iso,
        comment: comment.trim(),
      });
      if (saved) setVisible(false);
    };

    const canConfirm = exerciseCount > 0 && name.trim().length > 0;

    if (!visible) return null;

    return (
      <ThemeSheet onClose={() => setVisible(false)}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {initial ? "Сохранить изменения" : "Завершить тренировку"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {exerciseCount} {exerciseCount === 1 ? "упражнение" : "упражнений"}{" "}
            в тренировке
          </Text>

          <Field label="Название" value={name} onChangeText={setName} placeholder="Например, День груди" />

          <DateField
            label="Дата тренировки"
            value={dateInput}
            onChangeText={(v) => {
              setDateInput(v);
              setDateError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {dateError && (
            <Text style={[styles.error, { color: colors.danger }]}>
              {dateError}
            </Text>
          )}

          {/* Быстрые кнопки даты */}
          <View style={styles.dateShortcuts}>
            <ScalePressable
              onPress={() => {
                setDateInput(todayInputDate());
                setDateError(null);
              }}
              style={[
                styles.shortcut,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 13,
                }}
              >
                Сегодня
              </Text>
            </ScalePressable>
            <ScalePressable
              onPress={() => {
                setDateInput(yesterdayInputDate());
                setDateError(null);
              }}
              style={[
                styles.shortcut,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 13,
                }}
              >
                Вчера
              </Text>
            </ScalePressable>
          </View>

          <Field label="Комментарий (необязательно)" value={comment} onChangeText={setComment}
            placeholder="Ощущения, замечания, что улучшить" multiline />

          {/* Кнопки */}
          <View style={styles.actions}>
            <ScalePressable
              onPress={() => setVisible(false)}
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
              onPress={handleConfirm}
              disabled={!canConfirm || pending}
              style={[
                styles.button,
                {
                  ...(canConfirm ? primaryButton(colors) : { backgroundColor: colors.border }),
                },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={18}
                color={colors.textInverse}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: colors.textInverse,
                  fontWeight: "600",
                }}
              >
                {initial ? "Сохранить" : "Завершить"}
              </Text>
            </ScalePressable>
          </View>
        </View>
      </ThemeSheet>
    );
  },
);

FinishWorkoutSheet.displayName = "FinishWorkoutSheet";

const styles = StyleSheet.create({
  content: { gap: 6 },
  title: { fontSize: 21, fontFamily: headingFont },
  subtitle: { fontSize: 13, marginBottom: 12 },
  error: { fontSize: 12, marginTop: 4 },
  dateShortcuts: { flexDirection: "row", gap: 8, marginTop: 8 },
  shortcut: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 24 },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
});
