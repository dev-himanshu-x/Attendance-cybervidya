import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { cardShadow, colors, radius, spacing } from "@/theme";

export default function Card({
	children,
	style,
}: {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}) {
	return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: colors.card,
		borderRadius: radius.card,
		padding: spacing.card,
		...cardShadow,
	},
});
