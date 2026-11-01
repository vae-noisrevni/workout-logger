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
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Тренировка",
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="barbell-outline" size={size} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: "Упражнения",
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="list-outline" size={size} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "История",
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="time-outline" size={size} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Статистика",
          headerRight: () => <ThemeToggle />,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={iconColor(focused)} />
          ),
        }}
      />
    </Tabs>
  );
}
