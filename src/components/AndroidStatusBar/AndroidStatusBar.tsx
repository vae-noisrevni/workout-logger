import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AndroidStatusBar() {
    const { top } = useSafeAreaInsets();
    if (Platform.OS !== 'android') return null;
    return <>
        <StatusBar style="light" />
        <View pointerEvents="none" style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: top, backgroundColor: '#151517', zIndex: 1000, elevation: 1000,
        }} />
    </>;
}
