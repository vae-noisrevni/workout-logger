import { Text } from '@/components/Typography/Typography';
import { ListSearchHeader } from '@/components/ListSearchHeader/ListSearchHeader';
import { FlatList } from 'react-native-gesture-handler';
import { ExerciseForm } from '@/components/ExerciseForm/ExerciseForm';
import { useDialog } from '@/components/ConfirmDialog/DialogProvider';
import { ExerciseRow } from '@/components/ExerciseRow/ExerciseRow';
import { useExercises } from '@/hooks/useExercises';
import { useTheme } from '@/theme/ThemeContext';
import { Exercise } from '@/types/exercise';
import { exportExercises, parseExercises } from '@/utils/exerciseTransfer';
import { pickTextFile, type TransferFormat } from '@/utils/fileTransfer';
import { BottomSheet } from '@expo/ui/community/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

type SheetMode =
    | { type: 'create' }
    | { type: 'edit'; exercise: Exercise }
    | null;

export default function ExercisesScreen() {
    const colors = useTheme();
    const {
        exercises,
        search,
        setSearch,
        loading,
        error,
        create,
        update,
        remove,
        toggleFavorite,
        importData, allExercises, pending,
    } = useExercises();
    const dialog = useDialog();
    const [sheetMode, setSheetMode] = useState<SheetMode>(null);
    const sheetRef = useRef<BottomSheet>(null);

    const openCreate = () => {
        setSheetMode({ type: 'create' });
        requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
    };

    const openEdit = (exercise: Exercise) => {
        setSheetMode({ type: 'edit', exercise });
        sheetRef.current?.snapToIndex(0);
    };

    const handleExport = useCallback(
        async (format: TransferFormat) => {
            try {
                // Выгружаем весь справочник, а не отфильтрованный поиском список
                await exportExercises(allExercises, format);
            } catch (e) {
                dialog.show({
                    title: 'Ошибка',
                    message:
                        e instanceof Error
                            ? e.message
                            : 'Не удалось экспортировать',
                });
            }
        },
        [dialog, allExercises],
    );

    const handleExportPress = useCallback(() => {
        dialog.show({
            title: 'Экспорт упражнений',
            message: 'Выбери формат файла',
            buttons: [
                { text: 'CSV', onPress: () => handleExport('csv') },
                { text: 'JSON', onPress: () => handleExport('json') },
                { text: 'Отмена', style: 'cancel' },
            ],
        });
    }, [dialog, handleExport]);

    const handleImportPress = useCallback(async () => {
        try {
            const file = await pickTextFile();
            if (!file) return;
            const items = parseExercises(file.text, file.format);
            await importData(items);
            dialog.show({
                title: 'Импорт завершён',
                message: `Добавлено упражнений: ${items.length}`,
            });
        } catch (e) {
            dialog.show({
                title: 'Не удалось импортировать',
                message: e instanceof Error ? e.message : 'Неизвестная ошибка',
            });
        }
    }, [dialog, importData]);

    const closeSheet = () => sheetRef.current?.close();

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ListSearchHeader search={search} onSearchChange={setSearch}
                placeholder="Поиск упражнений" actions={[
                    { id: 'import', icon: 'arrow-down-outline', title: 'Импорт', onPress: handleImportPress },
                    { id: 'export', icon: 'arrow-up-outline', title: 'Экспорт', onPress: handleExportPress },
                ]} />

            {/* Кнопка добавления */}
            <Pressable
                onPress={openCreate}
                style={[styles.addButton, { backgroundColor: colors.accent }]}
            >
                <Ionicons name="add" size={28} color={colors.textInverse} />
            </Pressable>

            {/* Список / состояния */}
            {loading ? (
                <View style={styles.center}>
                    <Text style={{ color: colors.textSecondary }}>
                        Загрузка...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={{ color: colors.danger }}>{error}</Text>
                </View>
            ) : exercises.length === 0 ? (
                <View style={styles.center}>
                    <Text style={{ color: colors.textSecondary }}>
                        {search
                            ? 'Ничего не найдено'
                            : 'Нет упражнений. Добавь первое!'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={exercises}
                    keyExtractor={(item) => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <ExerciseRow
                            exercise={item}
                            colors={colors}
                            onPress={() => openEdit(item)}
                            onDelete={() => remove(item.id)}
                            onToggleFavorite={() => toggleFavorite(item)}
                        />
                    )}
                />
            )}

            {sheetMode && (
                <BottomSheet
                    ref={sheetRef}
                    snapPoints={['60%', '90%']}
                    enablePanDownToClose
                    onClose={() => setSheetMode(null)}
                    backgroundStyle={{
                        backgroundColor: colors.surfaceElevated,
                    }}
                >
                    <ExerciseForm
                        mode={sheetMode}
                        colors={colors}
                        onSubmit={async (data) => {
                            try {
                                if (sheetMode.type === 'create') await create(data);
                                else await update({ id: sheetMode.exercise.id, ...data });
                                closeSheet();
                            } catch {}
                        }}
                        pending={pending}
                        onCancel={closeSheet}
                    />
                </BottomSheet>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 40,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        zIndex: 10,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 120,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
