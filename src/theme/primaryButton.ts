import type { ViewStyle } from 'react-native';
import type { ThemeColors } from './colors';

export function primaryButton(colors: ThemeColors): ViewStyle {
    return {
        backgroundColor: colors.accent,
        backgroundImage: `linear-gradient(135deg, ${colors.accent}, ${colors.accentPressed})`,
    };
}
