import { headingFont } from '@/theme/typography';
//src/app/(tabs)/_layout.tsx
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { useTheme } from "@/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  const colors = useTheme();
  // RN 0.88: color из tabBarIcon типизирован как ColorValue (может быть number), Ionicons ждёт строку
  const iconColor = (focused: boolean) =>
    focused ? colors.accent : colors.textSecondary;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: headingFont, fontWeight: "normal", fontSize: 17 },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Тренировка",
          tabBarAccessibilityLabel: "Тренировка",
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ focused }) => (
            <Ionicons name="barbell-outline" size={30} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: "Упражнения",
          tabBarAccessibilityLabel: "Упражнения",
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ focused }) => (
            <Ionicons name="list-outline" size={30} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "История",
          tabBarAccessibilityLabel: "История",
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ focused }) => (
            <Ionicons name="time-outline" size={30} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Статистика",
          tabBarAccessibilityLabel: "Статистика",
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ focused }) => (
            <Ionicons name="stats-chart-outline" size={30} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen name="presets" options={{ title: "Пресеты", tabBarAccessibilityLabel: "Пресеты", headerRight: () => <ThemeToggle />,
        tabBarIcon: ({ color }) => <Ionicons name="albums-outline" color={typeof color === 'string' ? color : colors.textPrimary} size={30} /> }} />

    </Tabs>
  );
}
