import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "@/components/Card";
import type { DayRecord } from "@/data/sample";
import { weekTotals } from "@/lib/attendance";
import { colors, radius } from "@/theme";

const PLOT_HEIGHT = 104;
const BUBBLE_HEIGHT = 26;

// One series (classes attended) drawn over a faint "scheduled" track, so each
// bar shows what was attended out of what was on the timetable. Tap a bar to
// read its exact value; today is selected by default.
export default function WeeklyBarChart({
	week,
	todayIndex,
}: {
	week: DayRecord[];
	todayIndex: number;
}) {
	const [selected, setSelected] = useState(todayIndex);
	const maxScheduled = Math.max(...week.map((d) => d.scheduled), 1);
	const totals = weekTotals(week);

	return (
		<Card>
			<View style={styles.header}>
				<Text style={styles.title}>Classes this week</Text>
				<Text style={styles.caption}>
					{totals.attended} attended · {totals.scheduled} scheduled
				</Text>
			</View>

			<View style={styles.plot}>
				{week.map((day, i) => {
					const trackHeight = (day.scheduled / maxScheduled) * PLOT_HEIGHT;
					const barHeight = (day.attended / maxScheduled) * PLOT_HEIGHT;
					const isSelected = i === selected;
					const isUpcoming = i > todayIndex;
					return (
						<Pressable
							key={day.label}
							style={styles.column}
							onPress={() => setSelected(i)}
							accessibilityRole="button"
							accessibilityLabel={
								isUpcoming
									? `${day.label}: ${day.scheduled} classes scheduled`
									: `${day.label}: attended ${day.attended} of ${day.held} classes held`
							}
						>
							<View style={styles.bubbleSlot}>
								{isSelected && (
									<View style={styles.bubble}>
										<Text style={styles.bubbleText}>
											{isUpcoming
												? `${day.scheduled} due`
												: `${day.attended}/${day.held}`}
										</Text>
									</View>
								)}
							</View>
							<View style={styles.barArea}>
								<View style={[styles.track, { height: trackHeight }]} />
								{barHeight > 0 && (
									<View style={[styles.bar, { height: barHeight }]} />
								)}
							</View>
							<Text
								style={[
									styles.dayLabel,
									i === todayIndex && styles.dayLabelToday,
								]}
							>
								{day.label}
							</Text>
						</Pressable>
					);
				})}
			</View>

			<View style={styles.legend}>
				<View style={styles.legendItem}>
					<View style={[styles.swatch, { backgroundColor: colors.blue }]} />
					<Text style={styles.legendText}>Attended</Text>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.swatch, { backgroundColor: colors.blueTint }]} />
					<Text style={styles.legendText}>Scheduled</Text>
				</View>
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		marginBottom: 6,
	},
	title: { fontSize: 16, fontWeight: "700", color: colors.ink },
	caption: { fontSize: 13, fontWeight: "600", color: colors.muted },
	plot: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 10,
		borderBottomWidth: 0,
	},
	column: { flex: 1, alignItems: "center" },
	bubbleSlot: { height: BUBBLE_HEIGHT, justifyContent: "flex-end" },
	bubble: {
		backgroundColor: colors.ink,
		borderRadius: radius.pill,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	bubbleText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
	barArea: {
		height: PLOT_HEIGHT,
		width: "100%",
		maxWidth: 30,
		justifyContent: "flex-end",
		borderBottomWidth: 1,
		borderBottomColor: colors.hairline,
	},
	track: {
		position: "absolute",
		bottom: 0,
		width: "100%",
		backgroundColor: colors.blueTint,
		borderTopLeftRadius: radius.bar,
		borderTopRightRadius: radius.bar,
	},
	bar: {
		width: "100%",
		backgroundColor: colors.blue,
		borderTopLeftRadius: radius.bar,
		borderTopRightRadius: radius.bar,
	},
	dayLabel: {
		marginTop: 8,
		fontSize: 12,
		fontWeight: "600",
		color: colors.muted,
	},
	dayLabelToday: { color: colors.ink, fontWeight: "800" },
	legend: { flexDirection: "row", gap: 16, marginTop: 12 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	swatch: { width: 10, height: 10, borderRadius: 3 },
	legendText: { fontSize: 12, fontWeight: "600", color: colors.muted },
});
