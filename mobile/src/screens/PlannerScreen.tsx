import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useToken } from "@/auth/AuthProvider";
import Card from "@/components/Card";
import { ErrorCard, LoadingCard } from "@/components/Notice";
import ScreenScroll from "@/components/ScreenScroll";
import {
	useAttendance,
	useRangeSchedule,
	useWeekSchedule,
} from "@/hooks/queries";
import { useTarget } from "@/hooks/useTarget";
import { describeProjection, percentage } from "@/lib/attendance";
import { addDays, toDateKey } from "@/lib/dates";
import { overallTotals } from "@/lib/home";
import {
	type PlannerClass,
	projectTemplateOntoRange,
	simulateSkips,
	toPlannerClass,
} from "@/lib/planner";
import { describeLoadError } from "@/screens/HomeScreen";
import { colors, radius } from "@/theme";

type Range = "week" | 7 | 14;
const RANGES: { value: Range; label: string }[] = [
	{ value: "week", label: "This week" },
	{ value: 7, label: "Next 7 days" },
	{ value: 14, label: "Next 14 days" },
];

function dayHeading(lectureDate: string): string {
	const [day, month, year] = lectureDate.split("/").map(Number);
	return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
	});
}

export default function PlannerScreen() {
	const token = useToken();
	const { target } = useTarget();
	const attendance = useAttendance(token);
	const weekSchedule = useWeekSchedule(token);

	const [range, setRange] = useState<Range>("week");
	const [skipped, setSkipped] = useState<Set<string>>(new Set());

	const today = useMemo(() => {
		const d = new Date();
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	}, []);
	const rangeDays = range === "week" ? 0 : range;
	const rangeEnd = addDays(today, Math.max(rangeDays - 1, 0));
	const rangeSchedule = useRangeSchedule(
		token,
		toDateKey(today),
		toDateKey(rangeEnd),
		range !== "week",
	);

	const source = range === "week" ? weekSchedule : rangeSchedule;

	const classes = useMemo<PlannerClass[]>(() => {
		let entries = source.data ?? [];
		// No published timetable for the range (e.g. a future holiday): reuse
		// the regular weekly timetable.
		if (
			range !== "week" &&
			source.data &&
			!entries.some((e) => e.type === "CLASS")
		) {
			entries = projectTemplateOntoRange(
				weekSchedule.data ?? [],
				today,
				rangeEnd,
			);
		}
		const now = new Date();
		return entries
			.filter((e) => e.type === "CLASS" && !!e.lectureDate)
			.map(toPlannerClass)
			.filter((c) => c.startsAt > now)
			.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
	}, [source.data, range, weekSchedule.data, today, rangeEnd]);

	const days = useMemo(() => {
		const grouped = new Map<string, PlannerClass[]>();
		for (const c of classes) {
			const key = c.lectureDate as string;
			grouped.set(key, [...(grouped.get(key) ?? []), c]);
		}
		return [...grouped.entries()];
	}, [classes]);

	function toggle(key: string) {
		setSkipped((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}

	function changeRange(next: Range) {
		setRange(next);
		setSkipped(new Set());
	}

	const picked = classes.filter((c) => skipped.has(c.key));
	const data = attendance.data;
	const now = data ? overallTotals(data) : null;
	const sim = data
		? simulateSkips(
				data,
				picked.map((c) => c.courseCode),
				target,
			)
		: null;
	const currentPercent = now ? percentage(now.present, now.held) : 0;
	const drop = sim ? currentPercent - sim.percent : 0;

	return (
		<ScreenScroll>
			<View>
				<Text style={styles.title}>Planner</Text>
				<Text style={styles.subtitle}>
					Switch on the classes you might skip to see what happens to your
					attendance.
				</Text>
			</View>

			<View style={styles.segments}>
				{RANGES.map((r) => (
					<Pressable
						key={r.label}
						onPress={() => changeRange(r.value)}
						style={[styles.segment, range === r.value && styles.segmentOn]}
						accessibilityRole="button"
						accessibilityState={{ selected: range === r.value }}
					>
						<Text
							style={[
								styles.segmentText,
								range === r.value && styles.segmentTextOn,
							]}
						>
							{r.label}
						</Text>
					</Pressable>
				))}
			</View>

			{attendance.isPending && (
				<LoadingCard message="Loading your attendance…" />
			)}
			{attendance.isError && (
				<ErrorCard
					message={describeLoadError(attendance.error)}
					onRetry={() => attendance.refetch()}
				/>
			)}

			{sim && now && (
				<Card style={styles.summary}>
					<View style={styles.summaryRow}>
						<View style={styles.summaryCol}>
							<Text style={styles.summaryLabel}>Now</Text>
							<Text style={styles.summaryValue}>
								{Math.round(currentPercent)}%
							</Text>
						</View>
						<Ionicons name="arrow-forward" size={22} color={colors.muted} />
						<View style={styles.summaryCol}>
							<Text style={styles.summaryLabel}>
								If you skip {picked.length}
							</Text>
							<Text
								style={[
									styles.summaryValue,
									picked.length > 0 && styles.projected,
								]}
							>
								{sim.percent.toFixed(picked.length > 0 ? 1 : 0)}%
							</Text>
						</View>
					</View>
					<View
						style={[
							styles.chip,
							{
								backgroundColor:
									sim.projection.status === "warning"
										? colors.coralTint
										: colors.blueTint,
							},
						]}
					>
						<Ionicons
							name={
								sim.projection.status === "warning"
									? "alert-circle"
									: "checkmark-circle"
							}
							size={16}
							color={
								sim.projection.status === "warning" ? colors.coral : colors.blue
							}
						/>
						<Text style={styles.chipText}>
							{describeProjection(sim.projection)}
							{drop > 0.05 ? ` · down ${drop.toFixed(1)} points` : ""}
						</Text>
					</View>
					{sim.effects.length > 0 && (
						<View style={styles.effects}>
							{sim.effects.map((e) => (
								<View key={e.courseCode} style={styles.effect}>
									<Text style={styles.effectName} numberOfLines={1}>
										{e.courseName}
									</Text>
									<Text style={styles.effectValue}>
										{Math.round(e.before)}% → {e.after.toFixed(1)}%
									</Text>
								</View>
							))}
						</View>
					)}
					{picked.length > 0 && (
						<Pressable
							onPress={() => setSkipped(new Set())}
							style={styles.reset}
							accessibilityRole="button"
						>
							<Text style={styles.resetText}>Reset</Text>
						</Pressable>
					)}
				</Card>
			)}

			{source.isPending && range !== "week" && (
				<LoadingCard message="Loading timetable…" />
			)}
			{source.isError && (
				<ErrorCard
					message={describeLoadError(source.error)}
					onRetry={() => source.refetch()}
				/>
			)}
			{source.data && days.length === 0 && (
				<Text style={styles.empty}>No upcoming classes in this range.</Text>
			)}

			{days.map(([lectureDate, list]) => (
				<Card key={lectureDate} style={styles.day}>
					<Text style={styles.dayHeading}>{dayHeading(lectureDate)}</Text>
					{list.map((c, i) => (
						<View key={c.key} style={[styles.row, i > 0 && styles.rowDivider]}>
							<View style={styles.rowMain}>
								<Text style={styles.rowTitle} numberOfLines={1}>
									{c.courseName}
								</Text>
								<Text style={styles.rowSub}>
									{c.formattedStart} – {c.formattedEnd}
									{c.classRoom ? ` · ${c.classRoom}` : ""}
								</Text>
							</View>
							<Switch
								value={skipped.has(c.key)}
								onValueChange={() => toggle(c.key)}
								trackColor={{ false: colors.hairline, true: colors.coral }}
								accessibilityLabel={`Skip ${c.courseName} at ${c.formattedStart}`}
							/>
						</View>
					))}
				</Card>
			))}
		</ScreenScroll>
	);
}

const styles = StyleSheet.create({
	title: { fontSize: 26, fontWeight: "800", color: colors.ink },
	subtitle: {
		fontSize: 13,
		fontWeight: "500",
		color: colors.muted,
		marginTop: 2,
	},
	segments: {
		flexDirection: "row",
		backgroundColor: colors.card,
		borderRadius: radius.pill,
		padding: 4,
		gap: 4,
	},
	segment: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 8,
		borderRadius: radius.pill,
	},
	segmentOn: { backgroundColor: colors.blue },
	segmentText: { fontSize: 12, fontWeight: "700", color: colors.muted },
	segmentTextOn: { color: "#FFFFFF" },
	summary: { gap: 14 },
	summaryRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
	},
	summaryCol: { alignItems: "center", gap: 2 },
	summaryLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
	summaryValue: { fontSize: 34, fontWeight: "800", color: colors.ink },
	projected: { color: colors.blue },
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		alignSelf: "flex-start",
		borderRadius: radius.pill,
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
	chipText: {
		flexShrink: 1,
		fontSize: 12,
		fontWeight: "700",
		color: colors.ink,
	},
	effects: { gap: 6 },
	effect: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
	effectName: { flex: 1, fontSize: 12, fontWeight: "600", color: colors.muted },
	effectValue: { fontSize: 12, fontWeight: "800", color: colors.ink },
	reset: { alignSelf: "flex-end", padding: 4 },
	resetText: { fontSize: 13, fontWeight: "800", color: colors.blue },
	day: { paddingVertical: 12, gap: 2 },
	dayHeading: {
		fontSize: 14,
		fontWeight: "800",
		color: colors.ink,
		marginBottom: 4,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
		paddingVertical: 10,
	},
	rowDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
	rowMain: { flex: 1 },
	rowTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
	rowSub: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.muted,
		marginTop: 2,
	},
	empty: {
		textAlign: "center",
		fontSize: 14,
		fontWeight: "600",
		color: colors.muted,
		paddingVertical: 24,
	},
});
