// src/context/WorkoutDraftContext.tsx
import { useWorkoutDraft } from '@/hooks/useWorkoutDraft';
import { createContext, useContext, type ReactNode } from 'react';

type Value = ReturnType<typeof useWorkoutDraft>;

const Ctx = createContext<Value | null>(null);

// Черновик общий для вкладок: история должна уметь загрузить тренировку на экран тренировки
export function WorkoutDraftProvider({ children }: { children: ReactNode }) {
    const value = useWorkoutDraft();
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkoutDraftContext(): Value {
    const v = useContext(Ctx);
    if (!v)
        throw new Error(
            'useWorkoutDraftContext must be used within WorkoutDraftProvider',
        );
    return v;
}
