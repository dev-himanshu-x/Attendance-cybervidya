import type { ViewStyle } from "react-native";

// Soft cream canvas, coral as the primary accent, electric blue for charts
// and highlights. Coral on white is only ~2.7:1, so it is used for fills that
// sit next to a visible label; all text stays in `ink` / `muted`.
export const colors = {
	cream: "#FBF4E8",
	card: "#FFFFFF",
	ink: "#1F2333",
	muted: "#5F6475",
	hairline: "#F0E7D6",
	coral: "#FF6B57",
	coralTint: "#FFE4DF",
	green: "#1FA971",
	greenTint: "#D9F3E7",
	blue: "#2F6BFF",
	blueTint: "#DCE6FF",
} as const;

export const radius = {
	card: 24,
	pill: 999,
	bar: 6,
} as const;

export const spacing = {
	screen: 20,
	gap: 14,
	card: 18,
} as const;

export const cardShadow: ViewStyle = {
	shadowColor: "#8A6A3B",
	shadowOpacity: 0.12,
	shadowRadius: 16,
	shadowOffset: { width: 0, height: 6 },
	elevation: 3,
};
