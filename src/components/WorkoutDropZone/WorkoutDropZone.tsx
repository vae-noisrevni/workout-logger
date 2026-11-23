// src/components/WorkoutDropZone/WorkoutDropZone.tsx
import type { ThemeColors } from "@/theme/colors";
import type { ResolvedDraftExercise } from "@/utils/resolveDraft";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { GestureDetector, useNativeGesture, usePanGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from "react-native-reanimated";
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent, type ScrollViewInstance } from "react-native";
import { WorkoutCard } from "../WorkoutCard/WorkoutCard";

interface Props {
  draft: ResolvedDraftExercise[];
  colors: ThemeColors;
  onCardPress: (exercise: ResolvedDraftExercise) => void;
  onCardRemove: (exerciseId: number) => void;
  onMove: (exerciseId: number, targetId: number) => void;
}

export function WorkoutDropZone({
  draft,
  colors,
  onCardPress,
  onCardRemove,
  onMove,
}: Props) {
  const scroll = useRef<ScrollViewInstance>(null);
  const scrollGesture = useNativeGesture({});
  const viewport = useRef(0);
  const contentHeight = useRef(0);
  const offset = useRef(0);
  const rows = useRef(new Map<number, { y: number; height: number }>());
  const translation = useSharedValue(0);
  const session = useRef<{ from: number; to: number; height: number; startOffset: number; dy: number } | null>(null);
  const [preview, setPreview] = useState<{ from: number; to: number; height: number } | null>(null);

  const update = useCallback((dy: number) => {
    const drag = session.current;
    if (!drag) return;
    drag.dy = dy;
    const row = rows.current.get(draft[drag.from]?.exercise_id);
    if (!row) return;

    const delta = dy + offset.current - drag.startOffset;
    translation.set(delta);
    let to = drag.from;
    for (let index = 0; index < draft.length; index++) {
      const other = rows.current.get(draft[index].exercise_id);
      if (!other) continue;
      const midpoint = other.y + other.height / 2;
      if (index < drag.from && row.y + delta < midpoint) {
        to = index;
        break;
      }
      if (index > drag.from && row.y + row.height + delta > midpoint) to = index;
    }
    if (drag.to !== to) {
      drag.to = to;
      setPreview({ from: drag.from, to, height: drag.height });
    }
  }, [draft, translation]);

  const dragging = preview !== null;
  useEffect(() => {
    if (!dragging) return;
    const timer = setInterval(() => {
      const drag = session.current;
      if (!drag) return;
      const row = rows.current.get(draft[drag.from]?.exercise_id);
      if (!row) return;
      const handleY = row.y + 30 + drag.dy - drag.startOffset;
      const step = handleY < 48 && drag.dy < 0 ? -8
        : handleY > viewport.current - 48 && drag.dy > 0 ? 8 : 0;
      const next = Math.max(0, Math.min(offset.current + step, contentHeight.current - viewport.current));
      if (next === offset.current) return;
      offset.current = next;
      scroll.current?.scrollTo({ y: next, animated: false });
      update(drag.dy);
    }, 16);
    return () => clearInterval(timer);
  }, [draft, dragging, update]);

  const finish = (canceled: boolean) => {
    const drag = session.current;
    session.current = null;
    translation.set(0);
    setPreview(null);
    if (drag && !canceled && drag.from !== drag.to) {
      const from = draft[drag.from];
      const to = draft[drag.to];
      if (from && to) onMove(from.exercise_id, to.exercise_id);
    }
  };

  return (
    <View style={styles.container}>
      {draft.length === 0 ? (
        <View style={styles.empty} pointerEvents="none">
          <Ionicons
            name="fitness-outline"
            size={40}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Тапни по упражнению сверху, чтобы добавить его в тренировку
          </Text>
        </View>
      ) : (
        <GestureDetector gesture={scrollGesture}>
          <ScrollView
            ref={scroll}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onLayout={(event) => { viewport.current = event.nativeEvent.layout.height; }}
            onContentSizeChange={(_, height) => { contentHeight.current = height; }}
            onScroll={(event) => {
              if (!session.current) offset.current = event.nativeEvent.contentOffset.y;
            }}
          >
            {draft.map((exercise, index) => {
              const from = preview?.from ?? -1;
              const to = preview?.to ?? -1;
              const height = preview?.height ?? 0;
              const shift = index > from && index <= to ? -height
                : index < from && index >= to ? height : 0;
              return <DraggableRow
                key={exercise.exercise_id}
                active={index === from}
                shift={shift}
                translation={translation}
                onLayout={(event) => rows.current.set(exercise.exercise_id, event.nativeEvent.layout)}
              >
                <WorkoutCard
                  exercise={exercise}
                  colors={colors}
                  onPress={() => onCardPress(exercise)}
                  onRemove={() => onCardRemove(exercise.exercise_id)}
                  dragHandle={draft.length > 1 && <DragHandle
                    scrollGesture={scrollGesture}
                    color={colors.textSecondary}
                    canMoveUp={index > 0}
                    canMoveDown={index < draft.length - 1}
                    onStep={(step) => onMove(exercise.exercise_id, draft[index + step].exercise_id)}
                    onStart={() => {
                      const height = rows.current.get(exercise.exercise_id)?.height;
                      if (height === undefined) return;
                      const position = { from: index, to: index, height };
                      session.current = { ...position, startOffset: offset.current, dy: 0 };
                      setPreview(position);
                    }}
                    onMove={update}
                    onEnd={finish}
                  />}
                />
              </DraggableRow>;
            })}
          </ScrollView>
        </GestureDetector>
      )}
    </View>
  );
}

function DraggableRow({ active, shift, translation, onLayout, children }: {
  active: boolean;
  shift: number;
  translation: SharedValue<number>;
  onLayout: (event: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: active ? translation.value : shift }],
  }));
  return <Animated.View onLayout={onLayout} style={[style, { zIndex: active ? 1 : 0 }]}>
    {children}
  </Animated.View>;
}

function DragHandle({ scrollGesture, color, canMoveUp, canMoveDown, onStep, onStart, onMove, onEnd }: {
  scrollGesture: ReturnType<typeof useNativeGesture>;
  color: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onStep: (step: number) => void;
  onStart: () => void;
  onMove: (dy: number) => void;
  onEnd: (canceled: boolean) => void;
}) {
  const pan = usePanGesture({
    block: scrollGesture,
    minDistance: 4,
    maxPointers: 1,
    runOnJS: true,
    onActivate: onStart,
    onUpdate: ({ translationY }) => onMove(translationY),
    onDeactivate: ({ canceled }) => onEnd(canceled),
  });
  return <GestureDetector gesture={pan} touchAction="none">
    <View accessible accessibilityLabel="Порядок упражнения"
      accessibilityActions={[
        ...(canMoveUp ? [{ name: 'decrement', label: 'Переместить выше' }] : []),
        ...(canMoveDown ? [{ name: 'increment', label: 'Переместить ниже' }] : []),
      ]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === 'decrement' && canMoveUp) onStep(-1);
        if (nativeEvent.actionName === 'increment' && canMoveDown) onStep(1);
      }}
      onStartShouldSetResponder={() => true}
      style={styles.handle}>
      <Ionicons name="reorder-two-outline" size={26} color={color} />
    </View>
  </GestureDetector>;
}

const styles = StyleSheet.create({
  handle: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, marginTop: 8, marginHorizontal: 16 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    padding: 12,
    paddingTop: 4,
    paddingBottom: 96,
  },
});
