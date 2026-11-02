import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "@/components/Card";
import type { DayMap } from "@/hooks/queries";
import { addDays, toDateKey } from "@/lib/dates";
import { colors } from "@/theme";

const HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

type DayState = "full" | "partial" | "missed" | "none";

function stateOf(dayMap: DayMap, key: string): DayState {
	const lectures = dayMap[key];
	if (!lectures || lectures.length === 0) return "none";
	const missed = lectures.filter((l) => l.attendance === "ABSENT").length;
	if (missed === 0) return "full";
	return missed === lectures.length ? "missed" : "partial";
}

// Month grid, Monday first. Days with recorded classes are filled: coral when
// every class was attended, light coral when some were missed, outlined with a
// cross when all were missed. The selected day gets a blue ring.
export default function MonthCalendar({
	month,
	onChangeMonth,
	selectedKey,
	onSelect,
	todayKey,
	dayMap,
}: {
	month: Date;
	onChangeMonth: (next: Date) => void;
	selectedKey: string;
	onSelect: (key: string) => void;
	todayKey: string;
	dayMap: DayMap;
}) {
	const first = new Date(month.getFullYear(), month.getMonth(), 1);
	const gridStart = addDays(first, -((first.getDay() + 6) % 7));
	const daysInMonth = new Date(
		month.getFullYear(),
		month.getMonth() + 1,
		0,
	).getDate();
	const weeks = Math.ceil((((first.getDay() + 6) % 7) + daysInMonth) / 7);

	return (
		<Card>
			<View style={styles.header}>
				<Pressable
					onPress={() =>
						onChangeMonth(
							new Date(month.getFullYear(), month.getMonth() - 1, 1),
						)
					}
					hitSlop={12}
					accessibilityRole="button"
					accessibilityLabel="Previous month"
				>
					<Ionicons name="chevron-back" size={22} color={colors.blue} />
				</Pressable>
				<Text style={styles.monthTitle}>
					{first.toLocaleDateString("en-IN", {
						month: "long",
						year: "numeric",
					})}
				</Text>
				<Pressable
					onPress={() =>
						onChangeMonth(
							new Date(month.getFullYear(), month.getMonth() + 1, 1),
						)
					}
					hitSlop={12}
					accessibilityRole="button"
					accessibilityLabel="Next month"
				>
					<Ionicons name="chevron-forward" size={22} color={colors.blue} />
				</Pressable>
			</View>

			<View style={styles.row}>
				{HEADERS.map((h, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed weekday headers
					<Text key={i} style={styles.weekday}>
						{h}
					</Text>
				))}
			</View>

			{Array.from({ length: weeks }, (_, w) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: fixed grid rows
				<View key={w} style={styles.row}>
					{Array.from({ length: 7 }, (_, d) => {
						const date = addDays(gridStart, w * 7 + d);
						const key = toDateKey(date);
						const inMonth = date.getMonth() === month.getMonth();
						const state = inMonth ? stateOf(dayMap, key) : "none";
						const selected = key === selectedKey;
						return (
							<Pressable
								key={key}
								style={styles.cell}
								onPress={() => onSelect(key)}
								accessibilityRole="button"
								accessibilityLabel={date.toLocaleDateString("en-IN", {
									weekday: "long",
									day: "numeric",
									month: "long",
								})}
							>
								<View
									style={[
										styles.day,
										state === "full" && styles.full,
										state === "partial" && styles.partial,
										state === "missed" && styles.missed,
										selected && styles.selected,
									]}
								>
									<Text
										style={[
											styles.dayText,
											!inMonth && styles.outside,
											key === todayKey && styles.today,
										]}
									>
										{date.getDate()}
									</Text>
								</View>
							</Pressable>
						);
					})}
				</View>
			))}

			<View style={styles.legend}>
				<LegendItem style={styles.full} label="All attended" />
				<LegendItem style={styles.partial} label="Some missed" />
				<LegendItem style={styles.missed} label="All missed" />
			</View>
		</Card>
	);
}

function LegendItem({ style, label }: { style: object; label: string }) {
	return (
		<View style={styles.legendItem}>
			<View style={[styles.swatch, style]} />
			<Text style={styles.legendText}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	monthTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
	row: { flexDirection: "row" },
	weekday: {
		flex: 1,
		textAlign: "center",
		fontSize: 12,
		fontWeight: "700",
		color: colors.muted,
		paddingBottom: 6,
	},
	cell: { flex: 1, alignItems: "center", paddingVertical: 3 },
	day: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "transparent",
	},
	full: { backgroundColor: colors.coral },
	partial: { backgroundColor: colors.coralTint },
	missed: { borderColor: colors.hairline, borderWidth: 1.5 },
	selected: { borderColor: colors.blue, borderWidth: 2 },
	dayText: { fontSize: 14, fontWeight: "600", color: colors.ink },
	outside: { color: colors.hairline },
	today: { fontWeight: "900", textDecorationLine: "underline" },
	legend: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 10,
	},
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	swatch: { width: 12, height: 12, borderRadius: 6 },
	legendText: { fontSize: 11, fontWeight: "600", color: colors.muted },
});
