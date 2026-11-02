import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName, focusedName: IconName) {
	return ({ focused }: { focused: boolean }) => (
		<Ionicons
			name={focused ? focusedName : name}
			size={24}
			color={focused ? colors.blue : colors.muted}
		/>
	);
}

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.blue,
				tabBarInactiveTintColor: colors.muted,
				tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
				tabBarStyle: {
					backgroundColor: colors.card,
					borderTopColor: colors.hairline,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: tabIcon("home-outline", "home"),
				}}
			/>
			<Tabs.Screen
				name="courses"
				options={{
					title: "Courses",
					tabBarIcon: tabIcon("book-outline", "book"),
				}}
			/>
			<Tabs.Screen
				name="schedule"
				options={{
					title: "Schedule",
					tabBarIcon: tabIcon("calendar-outline", "calendar"),
				}}
			/>
			<Tabs.Screen
				name="planner"
				options={{
					title: "Planner",
					tabBarIcon: tabIcon("trending-up-outline", "trending-up"),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: tabIcon("person-outline", "person"),
				}}
			/>
		</Tabs>
	);
}
