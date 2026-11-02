import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useToken } from "@/auth/AuthProvider";
import DayClasses from "@/components/DayClasses";
import MonthCalendar from "@/components/MonthCalendar";
import { ErrorCard, LoadingCard } from "@/components/Notice";
import ScreenScroll from "@/components/ScreenScroll";
import {
	useAttendance,
	useLectureHistory,
	useStudentId,
	useWeekSchedule,
} from "@/hooks/queries";
import { addDays, formatLongDate, toDateKey } from "@/lib/dates";
import { describeLoadError } from "@/screens/HomeScreen";
import { colors, radius } from "@/theme";

type View_ = "day" | "month";

export default function ScheduleScreen() {
	const token = useToken();
	const attendance = useAttendance(token);
	const studentId = useStudentId(token);
	const schedule = useWeekSchedule(token);
	const history = useLectureHistory(token, studentId.data, attendance.data);

	const todayKey = toDateKey(new Date());
	const [view, setView] = useState<View_>("day");
	const [selectedKey, setSelectedKey] = useState(todayKey);
	const [month, setMonth] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});

	const selected = new Date(`${selectedKey}T12:00:00`);
	const dayMap = history.data ?? {};

	function shiftDay(by: number) {
		setSelectedKey(toDateKey(addDays(selected, by)));
	}

	return (
		<ScreenScroll
			refreshing={schedule.isRefetching}
			onRefresh={() => schedule.refetch()}
		>
			<Text style={styles.title}>Schedule</Text>

			<View style={styles.segments}>
				{(["day", "month"] as const).map((v) => (
					<Pressable
						key={v}
						onPress={() => setView(v)}
						style={[styles.segment, view === v && styles.segmentOn]}
						accessibilityRole="button"
						accessibilityState={{ selected: view === v }}
					>
						<Text
							style={[styles.segmentText, view === v && styles.segmentTextOn]}
						>
							{v === "day" ? "Day" : "Month"}
						</Text>
					</Pressable>
				))}
			</View>

			{view === "day" ? (
				<View style={styles.dayNav}>
					<Pressable
						onPress={() => shiftDay(-1)}
						hitSlop={12}
						accessibilityRole="button"
						accessibilityLabel="Previous day"
					>
						<Ionicons name="chevron-back" size={24} color={colors.blue} />
					</Pressable>
					<Pressable
						onPress={() => setSelectedKey(todayKey)}
						accessibilityRole="button"
						accessibilityLabel="Jump to today"
					>
						<Text style={styles.dayTitle}>{formatLongDate(selectedKey)}</Text>
						{selectedKey === todayKey && (
							<Text style={styles.todayTag}>Today</Text>
						)}
					</Pressable>
					<Pressable
						onPress={() => shiftDay(1)}
						hitSlop={12}
						accessibilityRole="button"
						accessibilityLabel="Next day"
					>
						<Ionicons name="chevron-forward" size={24} color={colors.blue} />
					</Pressable>
				</View>
			) : (
				<MonthCalendar
					month={month}
					onChangeMonth={setMonth}
					selectedKey={selectedKey}
					onSelect={setSelectedKey}
					todayKey={todayKey}
					dayMap={dayMap}
				/>
			)}

			{view === "month" && (
				<Text style={styles.dayTitleSmall}>{formatLongDate(selectedKey)}</Text>
			)}

			{history.isError && (
				<ErrorCard
					message={describeLoadError(history.error)}
					onRetry={() => history.refetch()}
				/>
			)}
			{history.isPending && history.fetchStatus !== "idle" && (
				<LoadingCard message="Loading your class history…" />
			)}
			<DayClasses
				dateKey={selectedKey}
				todayKey={todayKey}
				dayMap={dayMap}
				schedule={schedule.data ?? []}
			/>
		</ScreenScroll>
	);
}

const styles = StyleSheet.create({
	title: { fontSize: 26, fontWeight: "800", color: colors.ink },
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
	segmentText: { fontSize: 13, fontWeight: "700", color: colors.muted },
	segmentTextOn: { color: "#FFFFFF" },
	dayNav: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	dayTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: colors.ink,
		textAlign: "center",
	},
	todayTag: {
		fontSize: 11,
		fontWeight: "800",
		color: colors.blue,
		textAlign: "center",
	},
	dayTitleSmall: { fontSize: 14, fontWeight: "800", color: colors.ink },
});
