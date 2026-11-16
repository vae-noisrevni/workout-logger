// src/context/DataVersionContext.tsx
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

interface DataVersionValue {
    weightRevision: number;
    bumpWeight: () => void;
    presetsRevision: number;
    bumpPresets: () => void;
    exercisesRevision: number;
    workoutsRevision: number;
    bumpExercises: () => void;
    bumpWorkouts: () => void;
}

const Ctx = createContext<DataVersionValue | null>(null);

export function DataVersionProvider({ children }: { children: ReactNode }) {
    const [weightRevision, setWeightRevision] = useState(0);
    const [presetsRevision, setPresetsRevision] = useState(0);
    const bumpWeight = useCallback(() => setWeightRevision((v) => v + 1), []);
    const bumpPresets = useCallback(() => setPresetsRevision((v) => v + 1), []);
    const [exercisesRevision, setExercisesRevision] = useState(0);
    const [workoutsRevision, setWorkoutsRevision] = useState(0);

    const bumpExercises = useCallback(
        () => setExercisesRevision((v) => v + 1),
        []
    );
    const bumpWorkouts = useCallback(
        () => setWorkoutsRevision((v) => v + 1),
        []
    );

    const value = useMemo(
        () => ({
            weightRevision, bumpWeight, presetsRevision, bumpPresets,
            exercisesRevision,
            workoutsRevision,
            bumpExercises,
            bumpWorkouts,
        }),
        [exercisesRevision, workoutsRevision, bumpExercises, bumpWorkouts, weightRevision, bumpWeight, presetsRevision, bumpPresets]
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDataVersion(): DataVersionValue {
    const v = useContext(Ctx);
    if (!v)
        throw new Error(
            'useDataVersion must be used within DataVersionProvider'
        );
    return v;
}
