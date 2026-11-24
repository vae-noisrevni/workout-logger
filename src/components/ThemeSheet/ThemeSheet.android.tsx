import { useTheme, useThemeMode } from '@/theme/ThemeContext';
import { Host, ModalBottomSheet, RNHostView } from '@expo/ui/jetpack-compose';
import { fillMaxHeight, fillMaxWidth, imePadding } from '@expo/ui/jetpack-compose/modifiers';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export function ThemeSheet({ children, onClose, scroll = true }: {
    children: ReactNode;
    onClose: () => void;
    scroll?: boolean;
}) {
    const colors = useTheme();
    const { mode } = useThemeMode();
    return <Host style={StyleSheet.absoluteFill} pointerEvents="none" colorScheme={mode === 'system' ? undefined : mode}>
        <ModalBottomSheet onDismissRequest={onClose} containerColor={colors.surfaceElevated}
            skipPartiallyExpanded modifiers={[imePadding()]}>
            <RNHostView modifiers={[fillMaxWidth(), fillMaxHeight(0.82)]}>
                <View style={styles.content}>
                    {scroll ? <ScrollView nestedScrollEnabled keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scroll}>{children}</ScrollView> : children}
                </View>
            </RNHostView>
        </ModalBottomSheet>
    </Host>;
}

const styles = StyleSheet.create({
    content: { flexGrow: 1, height: 0 },
    scroll: { padding: 20, gap: 12 },
});
