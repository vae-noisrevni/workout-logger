import { bodyFonts } from '@/theme/typography';
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput, type TextStyle } from 'react-native';
import type { ComponentProps } from 'react';

function bodyStyle(style: TextStyle | null | undefined): TextStyle | undefined {
    if (style?.fontFamily) return undefined;
    const weight = Number(style?.fontWeight);
    const fontFamily = style?.fontWeight === 'bold' || weight >= 700 ? bodyFonts.bold
        : weight >= 600 ? bodyFonts.semibold
        : weight >= 500 ? bodyFonts.medium
        : bodyFonts.regular;
    return { fontFamily, fontWeight: 'normal' };
}

export function Text({ style, ...props }: ComponentProps<typeof NativeText>) {
    return <NativeText {...props} style={[style, bodyStyle(StyleSheet.flatten(style))]} />;
}

export function TextInput({ style, ...props }: ComponentProps<typeof NativeTextInput>) {
    return <NativeTextInput {...props} style={[style, bodyStyle(StyleSheet.flatten(style))]} />;
}
