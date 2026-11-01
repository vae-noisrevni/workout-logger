// src/components/SwipeToDelete/SwipeToDelete.tsx
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode, Ref } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Swipeable, {
    type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
    interpolate,
    useAnimatedStyle,
    type SharedValue,
} from 'react-native-reanimated';

const ACTION_WIDTH = 80;

interface Props {
    children: ReactNode;
    onDelete: () => void;
    radius: number;
    ref?: Ref<SwipeableMethods>;
    containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Строка списка со свайпом влево для удаления.
 * Список-родитель должен быть FlatList/ScrollView из react-native-gesture-handler,
 * иначе вертикальный скролл конфликтует со свайпом.
 */
export function SwipeToDelete({
    children,
    onDelete,
    radius,
    ref,
    containerStyle,
}: Props) {
    return (
        <Swipeable
            ref={ref}
            containerStyle={containerStyle}
            renderRightActions={(progress) => (
                <DeleteAction
                    progress={progress}
                    radius={radius}
                    onPress={onDelete}
                />
            )}
            overshootRight={false}
            rightThreshold={40}
            // Свайп стартует только после явного горизонтального сдвига,
            // чтобы диагональное движение пальца уходило в скролл
            dragOffsetFromLeft={20}
            dragOffsetFromRight={-20}
        >
            {children}
        </Swipeable>
    );
}

function DeleteAction({
    progress,
    radius,
    onPress,
}: {
    progress: SharedValue<number>;
    radius: number;
    onPress: () => void;
}) {
    const colors = useTheme();
    // В закрытом состоянии подложка лежит под карточкой и просвечивает по краям — прячем её
    const style = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.15], [0, 1], 'clamp'),
    }));

    return (
        <Animated.View style={[styles.wrapper, style]}>
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Удалить"
                style={[
                    styles.action,
                    { backgroundColor: colors.danger, borderRadius: radius },
                ]}
            >
                <Ionicons name="trash-outline" size={22} color="#fff" />
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: { width: ACTION_WIDTH + 8, paddingLeft: 8 },
    action: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
