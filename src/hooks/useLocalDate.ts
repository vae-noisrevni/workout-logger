import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { todayInputDate } from '@/utils/date';

// Проверяем смену локальной даты только на активном экране.
export function useLocalDate() {
    const [date, setDate] = useState(todayInputDate);
    useFocusEffect(useCallback(() => {
        const refresh = () => setDate(todayInputDate());
        const timer = setInterval(refresh, 30000);
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') refresh();
        });
        const initial = setTimeout(refresh, 0);
        return () => { clearInterval(timer); clearTimeout(initial); subscription.remove(); };
    }, []));
    return date;
}
