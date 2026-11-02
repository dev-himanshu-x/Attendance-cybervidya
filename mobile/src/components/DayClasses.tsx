import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Card from "@/components/Card";
import type { CourseDay, DayMap } from "@/hooks/queries";
import { formatShortTime, parseLectureDate } from "@/lib/dates";
import { colors, radius } from "@/theme";
import type { ScheduleEntry } from "@/types/response";

type Status = "present" | "adjusted" | "absent" | "upcoming" | "none";

const STATUS: Record<
	Status,
	{ bg: string; icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
	present: { bg: colors.blueTint, icon: "checkmark", label: "Present" },
	adjusted: { bg: colors.hairline, icon: "remove", label: "Adjusted" },
	absent: { bg: colors.coralTint, icon: "close", label: "Absent" },
	upcoming: { bg: colors.hairline, icon: "time-outline", label: "Upcoming" },
	none: { bg: colors.hairline, icon: "help", label: "Not marked" },
};

function toStatus(attendance: CourseDay["attendance"]): Status {
	return attendance === "PRESENT"
		? "present"
		: attendance === "ADJUSTED"
			? "adjusted"
			: "absent";
}

interface Row {
	key: string;
	title: string;
	sub: string;
	status: Status;
}

// Rows for one date: the timetable (with each class's attendance matched in by
// course) when the schedule covers the date, otherwise the recorded lectures.
function buildRows(
	dateKey: string,
	todayKey: string,
	dayMap: DayMap,
	schedule: ScheduleEntry[],
): { rows: Row[]; holiday: string | null } {
	const lectures = dayMap[dateKey] ?? [];
	const entries = schedule
		.filter((e) => parseLectureDate(e.lectureDate) === dateKey)
		.sort((a, b) => a.start.localeCompare(b.start));
	const holiday = entries.find((e) => e.type === "HOLIDAY")?.title ?? null;
	const classes = entries.filter((e) => e.type === "CLASS");

	if (classes.length === 0) {
		return {
			holiday,
			rows: lectures.map((l, i) => ({
				key: `${l.courseCode}-${l.timeSlot}-${i}`,
				title: l.courseName,
				sub: `${l.componentName} · ${l.timeSlot}`,
				status: toStatus(l.attendance),
			})),
		};
	}

	const used = new Set<number>();
	const rows = classes.map((c, i): Row => {
		const match = lectures.findIndex(
			(l, idx) => !used.has(idx) && l.courseCode === c.courseCode,
		);
		let status: Status;
		if (match >= 0) {
			used.add(match);
			status = toStatus(lectures[match].attendance);
		} else {
			status =
				dateKey > todayKey
					? "upcoming"
					: dateKey === todayKey
						? "upcoming"
						: "none";
		}
		return {
			key: `${c.courseCode}-${c.start}-${i}`,
			title: c.courseName,
			sub: `${formatShortTime(c.start)} – ${formatShortTime(c.end)}${c.classRoom ? ` · ${c.classRoom}` : ""}`,
			status,
		};
	});
	return { rows, holiday };
}

export default function DayClasses({
	dateKey,
	todayKey,
	dayMap,
	schedule,
}: {
	dateKey: string;
	todayKey: string;
	dayMap: DayMap;
	schedule: ScheduleEntry[];
}) {
	const { rows, holiday } = buildRows(dateKey, todayKey, dayMap, schedule);

	if (rows.length === 0) {
		return (
			<Card style={styles.empty}>
				<Ionicons
					name={holiday ? "sunny-outline" : "cafe-outline"}
					size={26}
					color={colors.muted}
				/>
				<Text style={styles.emptyText}>
					{holiday ? `Holiday · ${holiday}` : "No classes on this day."}
				</Text>
			</Card>
		);
	}

	return (
		<Card style={styles.list}>
			{rows.map((row, i) => {
				const s = STATUS[row.status];
				return (
					<View key={row.key} style={[styles.row, i > 0 && styles.divider]}>
						<View style={styles.main}>
							<Text style={styles.title} numberOfLines={2}>
								{row.title}
							</Text>
							<Text style={styles.sub}>{row.sub}</Text>
						</View>
						<View style={[styles.chip, { backgroundColor: s.bg }]}>
							<Ionicons name={s.icon} size={13} color={colors.ink} />
							<Text style={styles.chipText}>{s.label}</Text>
						</View>
					</View>
				);
			})}
		</Card>
	);
}

const styles = StyleSheet.create({
	list: { paddingVertical: 4 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 12,
	},
	divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
	main: { flex: 1 },
	title: { fontSize: 14, fontWeight: "700", color: colors.ink },
	sub: { fontSize: 12, fontWeight: "500", color: colors.muted, marginTop: 2 },
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		borderRadius: radius.pill,
		paddingVertical: 4,
		paddingHorizontal: 10,
	},
	chipText: { fontSize: 12, fontWeight: "700", color: colors.ink },
	empty: { alignItems: "center", gap: 8, paddingVertical: 28 },
	emptyText: { fontSize: 14, fontWeight: "600", color: colors.muted },
});
