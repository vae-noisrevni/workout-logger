export interface ThemeColors {
    // Фоны
    background: string;
    surface: string;
    surfaceElevated: string;

    // Текст
    textPrimary: string;
    textSecondary: string;
    textInverse: string;

    // Акцент
    accent: string;
    accentPressed: string;
    accentMuted: string;
    accentTint: string;

    // Границы
    border: string;
    borderFocused: string;

    // Семантические
    favorite: string;
    danger: string;
    success: string;
}

export const darkTheme: ThemeColors = {
    background: '#151517',
    surface: '#1b1b1c',
    surfaceElevated: '#2c2c2e',

    textPrimary: '#f5f5f7',
    textSecondary: '#a1a1a6',
    textInverse: '#fff',

    accent: '#0047AB', // кобальт
    accentPressed: '#003580',
    accentMuted: '#003366',
    accentTint: '#1E3556',

    border: '#2c2c2e',
    borderFocused: '#0047AB',

    favorite: '#ff78a6',
    danger: '#ff453a',
    success: '#30d158',
};

export const lightTheme: ThemeColors = {
    background: '#FDFBF7', // молочный
    surface: '#FFFFFF',
    surfaceElevated: '#F5F0E8',

    textPrimary: '#2c1810',
    textSecondary: '#6b5b54',
    textInverse: '#FDFBF7',

    accent: '#800020', // бургунди
    accentPressed: '#5c0018',
    accentMuted: '#a3334a',
    accentTint: '#E5CED0',

    border: '#E8E0D5',
    borderFocused: '#800020',

    favorite: '#b91e5e',
    danger: '#c62828',
    success: '#2e7d32',
};
