export type ExerciseType = 'weighted' | 'assisted' | 'bodyweight';

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
    weighted: 'Утяжеление',
    assisted: 'Облегчение',
    bodyweight: 'Свой вес',
};

export interface Exercise {
    id: number;
    name: string;
    type: ExerciseType;
    description: string;
    color: string; // hex
    favorite: boolean;
}

// favorite необязателен: старые файлы импорта и форма создания его могут не задавать
export type CreateExerciseInput = Omit<Exercise, 'id' | 'favorite'> & {
    favorite?: boolean;
};
export type UpdateExerciseInput = Partial<CreateExerciseInput> & { id: number };
