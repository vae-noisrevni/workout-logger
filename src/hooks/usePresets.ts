import { useMemo } from 'react';
import { useDataVersion } from '@/context/DataVersionContext';
import { getPresets } from '@/db/presets';

export function usePresets() {
    const { presetsRevision, exercisesRevision, bumpPresets } = useDataVersion();
    const result = useMemo(() => {
        void presetsRevision; void exercisesRevision;
        try { return { presets: getPresets(), error: null }; }
        catch (error) { return { presets: [], error: error instanceof Error ? error.message : 'Не удалось загрузить пресеты' }; }
    }, [presetsRevision, exercisesRevision]);
    return { ...result, refresh: bumpPresets };
}
