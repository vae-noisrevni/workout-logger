import type { WeightUnit } from '@/utils/weight';
export type ExerciseType = 'weighted' | 'assisted' | 'bodyweight';

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
    weighted: 'Утяжеление',
    assisted: 'Облегчение',
    bodyweight: 'Свой вес',
};

export interface Exercise {
    id: number;
    is_favorite: boolean;
    weight_unit: WeightUnit;
    name: string;
    type: ExerciseType;
    description: string;
    color: string; // hex
}

export type CreateExerciseInput = Omit<Exercise, 'id' | 'weight_unit'> & { weight_unit?: WeightUnit };
export type UpdateExerciseInput = Partial<CreateExerciseInput> & { id: number };
