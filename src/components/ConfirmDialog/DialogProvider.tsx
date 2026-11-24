import { primaryButton } from '@/theme/primaryButton';
import { Text } from '@/components/Typography/Typography';
import { headingFont } from '@/theme/typography';
import { ScalePressable } from '@/components/ScalePressable/ScalePressable';
// src/components/ConfirmDialog/DialogProvider.tsx
import { useTheme } from '@/theme/ThemeContext';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { Modal, StyleSheet, View } from 'react-native';

export interface DialogButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface DialogOptions {
    title: string;
    message?: string;
    /** По умолчанию одна кнопка «ОК» */
    buttons?: DialogButton[];
}

interface Value {
    /** Замена Alert.alert со стилизацией под тему проекта */
    show: (options: DialogOptions) => void;
}

const Ctx = createContext<Value | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
    const colors = useTheme();
    const [dialog, setDialog] = useState<DialogOptions | null>(null);

    const show = useCallback((options: DialogOptions) => setDialog(options), []);
    const value = useMemo(() => ({ show }), [show]);

    const buttons = dialog?.buttons?.length
        ? dialog.buttons
        : [{ text: 'ОК' } as DialogButton];

    const handlePress = (button: DialogButton) => {
        setDialog(null);
        button.onPress?.();
    };

    return (
        <Ctx.Provider value={value}>
            {children}
            <Modal
                visible={dialog !== null}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => setDialog(null)}
            >
                <View style={styles.backdrop} accessibilityViewIsModal>
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.surfaceElevated,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <Text
                            style={[styles.title, { color: colors.textPrimary }]}
                        >
                            {dialog?.title}
                        </Text>
                        {dialog?.message ? (
                            <Text
                                style={[
                                    styles.message,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                {dialog.message}
                            </Text>
                        ) : null}
                        <View style={styles.actions}>
                            {buttons.map((button, index) => {
                                const isDestructive =
                                    button.style === 'destructive';
                                const isCancel = button.style === 'cancel';
                                const filled = !isCancel;
                                return (
                                    <ScalePressable
                                        key={index}
                                        accessibilityRole="button"
                                        onPress={() => handlePress(button)}
                                        style={[
                                            styles.button,
                                            filled
                                                ? isDestructive
                                                    ? { backgroundColor: colors.danger }
                                                    : primaryButton(colors)
                                                : {
                                                      backgroundColor:
                                                          colors.surface,
                                                      borderColor:
                                                          colors.border,
                                                      borderWidth: 1,
                                                  },
                                        ]}
                                    >
                                        <Text
                                            style={{
                                                color: filled
                                                    ? colors.textInverse
                                                    : colors.textPrimary,
                                                fontWeight: '600',
                                            }}
                                        >
                                            {button.text}
                                        </Text>
                                    </ScalePressable>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
        </Ctx.Provider>
    );
}

export function useDialog(): Value {
    const v = useContext(Ctx);
    if (!v) throw new Error('useDialog must be used within DialogProvider');
    return v;
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 22,
        borderWidth: 1,
        padding: 22,
        gap: 10,
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
    },
    title: { fontSize: 17, fontFamily: headingFont },
    message: { fontSize: 14, lineHeight: 20 },
    actions: { gap: 8, marginTop: 12 },
    button: {
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
