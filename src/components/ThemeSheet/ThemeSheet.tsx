import { useEffect, useRef, type ReactNode } from 'react';
import { BottomSheet, BottomSheetScrollView, type BottomSheetMethods } from '@expo/ui/community/bottom-sheet';
import { useTheme } from '@/theme/ThemeContext';

export function ThemeSheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
    const ref = useRef<BottomSheetMethods>(null);
    const colors = useTheme();
    useEffect(() => {
        const frame = requestAnimationFrame(() => ref.current?.present());
        return () => cancelAnimationFrame(frame);
    }, []);
    return <BottomSheet ref={ref} index={0} snapPoints={['70%', '90%']} enablePanDownToClose
        onClose={onClose} backgroundStyle={{ backgroundColor: colors.surfaceElevated }}>
        <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 12 }}>
            {children}
        </BottomSheetScrollView>
    </BottomSheet>;
}
