import { Text } from '@/components/Typography/Typography';
import { SearchField } from '@/components/SearchField/SearchField';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const menuEntering = FadeInUp.duration(160)
    .withInitialValues({ transform: [{ translateY: -8 }] })
    .reduceMotion(ReduceMotion.System);

interface HeaderAction {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    disabled?: boolean;
    destructive?: boolean;
}

export function ListSearchHeader({ search, onSearchChange, placeholder, actions }: {
    search: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
    actions: HeaderAction[];
}) {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const anchor = useRef<ComponentRef<typeof View>>(null);
    const overlay = useRef<ComponentRef<typeof View>>(null);
    const [anchorBounds, setAnchorBounds] = useState<{ right: number; bottom: number } | null>(null);
    const [viewport, setViewport] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const pendingAction = useRef<(() => void) | null>(null);
    const close = () => {
        setAnchorBounds(null);
        setViewport(null);
    };
    const runPendingAction = () => {
        const action = pendingAction.current;
        pendingAction.current = null;
        action?.();
    };
    const select = (onPress: () => void) => {
        pendingAction.current = onPress;
        close();
        if (Platform.OS !== 'ios') requestAnimationFrame(runPendingAction);
    };
    const open = () => {
        Keyboard.dismiss();
        anchor.current?.measureInWindow((x, y, anchorWidth, anchorHeight) => {
            setAnchorBounds({ right: x + anchorWidth, bottom: y + anchorHeight });
        });
    };

    const menuPosition = anchorBounds && viewport && (() => {
        const width = Math.min(280, viewport.width - insets.left - insets.right - 32);
        const right = Math.max(insets.right + 16,
            Math.min(viewport.x + viewport.width - anchorBounds.right, viewport.width - width - insets.left - 16));
        const top = Math.max(0, anchorBounds.bottom - viewport.y) + 12;
        return { right, top, width, maxHeight: viewport.height - top - insets.bottom - 12 };
    })();

    return <View style={styles.header}>
        <View style={styles.search}>
            <SearchField value={search} onChangeText={onSearchChange} placeholder={placeholder} />
        </View>
        <View ref={anchor} collapsable={false}>
            <ScalePressable accessibilityRole="button" accessibilityLabel="Действия"
                accessibilityState={{ expanded: anchorBounds !== null }} onPress={open}
                style={[styles.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
            </ScalePressable>
        </View>
        <Modal transparent visible={anchorBounds !== null} statusBarTranslucent onDismiss={runPendingAction} onRequestClose={close}>
            <View ref={overlay} collapsable={false} style={styles.overlay} accessibilityViewIsModal
                onLayout={({ nativeEvent: { layout } }) => {
                    const { width, height } = layout;
                    overlay.current?.measureInWindow((x, y) => setViewport({ x, y, width, height }));
                }}>
                <Pressable onPress={close} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Закрыть меню" />
                {menuPosition && menuPosition.maxHeight > 0 && <Animated.View entering={menuEntering} style={[styles.menu, menuPosition, {
                    backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
                        {actions.map(({ id, title, icon, disabled, destructive, onPress }) => (
                            <ScalePressable key={id} accessibilityRole="button" disabled={disabled}
                                accessibilityState={{ disabled }} style={[styles.item, disabled && styles.disabled]}
                                onPress={() => select(onPress)}>
                                <Ionicons name={icon} size={20} color={destructive ? colors.danger : colors.textSecondary} />
                                <Text style={[styles.itemText, { color: destructive ? colors.danger : colors.textPrimary }]}>{title}</Text>
                            </ScalePressable>
                        ))}
                    </ScrollView>
                </Animated.View>}
            </View>
        </Modal>
    </View>;
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12 },
    search: { flex: 1 },
    trigger: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)' },
    menu: { position: 'absolute', borderWidth: 1, borderRadius: 16, padding: 6, elevation: 8,
        shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
    item: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    itemText: { flex: 1, fontSize: 15, fontWeight: '600' },
    disabled: { opacity: 0.42 },
});
