import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Card from "@/components/Card";
import type { DayRecord } from "@/data/sample";
import { type DayStatus, dayStatus, weekTotals } from "@/lib/attendance";
import { colors } from "@/theme";

const STATUS_LABEL: Record<DayStatus, string> = {
	full: "all classes attended",
	partial: "some classes missed",
	missed: "all classes missed",
	today: "today",
	upcoming: "upcoming",
};

function DayDot({ status }: { status: DayStatus }) {
	switch (status) {
		case "full":
			return (
				<View style={[styles.dot, { backgroundColor: colors.coral }]}>
					<Ionicons name="checkmark" size={18} color="#FFFFFF" />
				</View>
			);
		case "partial":
			return (
				<View style={[styles.dot, { backgroundColor: colors.coralTint }]}>
					<Ionicons name="remove" size={18} color={colors.ink} />
				</View>
			);
		case "missed":
			return (
				<View style={[styles.dot, styles.dotOutline]}>
					<Ionicons name="close" size={16} color={colors.muted} />
				</View>
			);
		case "today":
			return (
				<View style={[styles.dot, styles.dotToday]}>
					<View style={styles.todayCore} />
				</View>
			);
		default:
			return <View style={[styles.dot, styles.dotUpcoming]} />;
	}
}

export default function WeeklySummary({
	week,
	todayIndex,
}: {
	week: DayRecord[];
	todayIndex: number;
}) {
	const totals = weekTotals(week);

	return (
		<Card>
			<View style={styles.header}>
				<Text style={styles.title}>This week</Text>
				<Text style={styles.caption}>
					{totals.attended} of {totals.held} classes
				</Text>
			</View>
			<View style={styles.row}>
				{week.map((day, i) => {
					const status = dayStatus(day, i, todayIndex);
					return (
						<View
							key={day.label}
							style={styles.cell}
							accessible
							accessibilityLabel={`${day.label}: ${STATUS_LABEL[status]}`}
						>
							<DayDot status={status} />
							<Text
								style={[styles.dayLabel, status === "today" && styles.dayToday]}
							>
								{day.label}
							</Text>
						</View>
					);
				})}
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		marginBottom: 14,
	},
	title: { fontSize: 16, fontWeight: "700", color: colors.ink },
	caption: { fontSize: 13, fontWeight: "600", color: colors.muted },
	row: { flexDirection: "row", justifyContent: "space-between" },
	cell: { alignItems: "center", gap: 6, flex: 1 },
	dot: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	dotOutline: { borderWidth: 1.5, borderColor: colors.hairline },
	dotToday: { borderWidth: 2, borderColor: colors.blue },
	todayCore: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: colors.blue,
	},
	dotUpcoming: {
		borderWidth: 1.5,
		borderColor: colors.hairline,
		borderStyle: "dashed",
	},
	dayLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
	dayToday: { color: colors.ink, fontWeight: "800" },
});
