import { useMemo } from 'react';
import { useDataVersion } from '@/context/DataVersionContext';
import { getBodyWeightEntries } from '@/db/bodyWeight';

export function useBodyWeight() {
    const { weightRevision, bumpWeight } = useDataVersion();
    const result = useMemo(() => {
        void weightRevision;
        try { return { entries: getBodyWeightEntries(), error: null }; }
        catch (error) { return { entries: [], error: error instanceof Error ? error.message : 'Не удалось загрузить замеры' }; }
    }, [weightRevision]);
    return { ...result, refresh: bumpWeight };
}
