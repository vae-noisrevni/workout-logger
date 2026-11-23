import { useEffect, useRef, type ReactNode } from 'react';
import { BottomSheet, BottomSheetScrollView, type BottomSheetMethods } from '@expo/ui/community/bottom-sheet';
import { useTheme } from '@/theme/ThemeContext';

export function ThemeSheet({ children, onClose, scroll = true }: { children: ReactNode; onClose: () => void; scroll?: boolean }) {
    const ref = useRef<BottomSheetMethods>(null);
    const colors = useTheme();
    useEffect(() => {
        const frame = requestAnimationFrame(() => ref.current?.present());
        return () => cancelAnimationFrame(frame);
    }, []);
    return <BottomSheet ref={ref} index={0} snapPoints={['70%', '90%']} enablePanDownToClose
        onClose={onClose} backgroundStyle={{ backgroundColor: colors.surfaceElevated }}>
        {scroll ? <BottomSheetScrollView nestedScrollEnabled keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 12 }}>
            {children}
        </BottomSheetScrollView> : children}
    </BottomSheet>;
}
