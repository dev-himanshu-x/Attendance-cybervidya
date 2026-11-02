import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import Card from "@/components/Card";
import { colors, radius } from "@/theme";

// In-card loading / error state.
export function LoadingCard({ message }: { message: string }) {
	return (
		<Card style={styles.center}>
			<ActivityIndicator color={colors.coral} />
			<Text style={styles.text}>{message}</Text>
		</Card>
	);
}

export function ErrorCard({
	message,
	onRetry,
}: {
	message: string;
	onRetry?: () => void;
}) {
	return (
		<Card style={styles.center}>
			<Ionicons name="alert-circle" size={26} color={colors.coral} />
			<Text style={styles.text}>{message}</Text>
			{onRetry && (
				<Pressable
					onPress={onRetry}
					style={styles.retry}
					accessibilityRole="button"
				>
					<Text style={styles.retryText}>Try again</Text>
				</Pressable>
			)}
		</Card>
	);
}

const styles = StyleSheet.create({
	center: { alignItems: "center", gap: 10, paddingVertical: 28 },
	text: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.muted,
		textAlign: "center",
	},
	retry: {
		backgroundColor: colors.coral,
		borderRadius: radius.pill,
		paddingVertical: 9,
		paddingHorizontal: 18,
	},
	retryText: { fontSize: 14, fontWeight: "800", color: colors.ink },
});
