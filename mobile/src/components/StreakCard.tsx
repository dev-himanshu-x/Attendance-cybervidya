import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Card from "@/components/Card";
import { colors, radius } from "@/theme";

export default function StreakCard({
	days,
	best,
}: {
	days: number;
	best: number;
}) {
	const progress = best === 0 ? 0 : Math.min(days / best, 1);

	return (
		<Card style={styles.card}>
			<View style={styles.flame}>
				<Ionicons name="flame" size={28} color="#FFFFFF" />
			</View>
			<View
				style={styles.body}
				accessible
				accessibilityLabel={`Attendance streak ${days} days, best ${best} days`}
			>
				<View style={styles.topRow}>
					<Text style={styles.value}>
						{days}
						<Text style={styles.unit}> day streak</Text>
					</Text>
					<Text style={styles.best}>Best {best}</Text>
				</View>
				<Text style={styles.sub}>Days in a row with no missed class</Text>
				<View style={styles.track}>
					<View style={[styles.fill, { width: `${progress * 100}%` }]} />
				</View>
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	card: { flexDirection: "row", alignItems: "center", gap: 14 },
	flame: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: colors.coral,
		alignItems: "center",
		justifyContent: "center",
	},
	body: { flex: 1, gap: 4 },
	topRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
	},
	value: { fontSize: 26, fontWeight: "800", color: colors.ink },
	unit: { fontSize: 14, fontWeight: "700", color: colors.muted },
	best: { fontSize: 13, fontWeight: "600", color: colors.muted },
	sub: { fontSize: 12, fontWeight: "500", color: colors.muted },
	track: {
		height: 6,
		borderRadius: radius.pill,
		backgroundColor: colors.blueTint,
		marginTop: 6,
		overflow: "hidden",
	},
	fill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.blue },
});
