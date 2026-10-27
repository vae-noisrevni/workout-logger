// src/components/ExerciseSquare/ExerciseSquare.tsx
import { EXERCISE_TYPE_ICONS } from '@/constants/exerciseIcons';
import type { ThemeColors } from '@/theme/colors';
import type { Exercise } from '@/types/exercise';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    exercise: Exercise;
    colors: ThemeColors;
    onPress: (exercise: Exercise) => void;
}

export function ExerciseSquare({ exercise, onPress }: Props) {
    return (
        <Pressable
            onPress={() => onPress(exercise)}
            style={({ pressed }) => [
                styles.square,
                {
                    backgroundColor: exercise.color,
                    opacity: pressed ? 0.7 : 1,
                },
            ]}
        >
            <>
                <View style={styles.iconWrap}>
                    <Ionicons
                        name={EXERCISE_TYPE_ICONS[exercise.type]}
                        size={22}
                        color="#151517"
                    />
                </View>
                <Text numberOfLines={2} style={styles.label}>
                    {exercise.name}
                </Text>
            </>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    square: {
        width: 96,
        height: 96,
        borderRadius: 16,
        padding: 10,
        marginRight: 10,
        justifyContent: 'space-between',
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#151517',
    },
});
