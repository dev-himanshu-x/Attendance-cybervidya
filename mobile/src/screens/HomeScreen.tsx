import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/http";
import { useAuth, useToken } from "@/auth/AuthProvider";
import AttendanceRing from "@/components/AttendanceRing";
import { ErrorCard, LoadingCard } from "@/components/Notice";
import ScreenScroll from "@/components/ScreenScroll";
import StreakCard from "@/components/StreakCard";
import WeeklyBarChart from "@/components/WeeklyBarChart";
import WeeklySummary from "@/components/WeeklySummary";
import {
	useAttendance,
	useLectureHistory,
	useStudentId,
	useWeekSchedule,
} from "@/hooks/queries";
import { useTarget } from "@/hooks/useTarget";
import { projectAttendance } from "@/lib/attendance";
import { formatLongDate } from "@/lib/dates";
import { buildHomeData } from "@/lib/home";
import { colors } from "@/theme";

export function describeLoadError(err: unknown): string {
	if (err instanceof ApiError && err.status === 403) {
		return "CyberVidya's firewall refused this request (403). Try again later or on a different network.";
	}
	return err instanceof Error ? err.message : "Couldn't load your data.";
}

function initials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export default function HomeScreen() {
	const token = useToken();
	const { signOut } = useAuth();
	const { target } = useTarget();

	const attendance = useAttendance(token);
	const studentId = useStudentId(token);
	const schedule = useWeekSchedule(token);
	const history = useLectureHistory(token, studentId.data, attendance.data);

	// An expired session sends the student back to the login screen.
	useEffect(() => {
		const err = attendance.error;
		if (err instanceof ApiError && err.status === 401) signOut();
	}, [attendance.error, signOut]);

	if (attendance.isPending) {
		return (
			<ScreenScroll>
				<LoadingCard message="Loading your attendance…" />
			</ScreenScroll>
		);
	}
	if (attendance.isError || !attendance.data) {
		return (
			<ScreenScroll>
				<ErrorCard
					message={describeLoadError(attendance.error)}
					onRetry={() => attendance.refetch()}
				/>
			</ScreenScroll>
		);
	}

	const data = buildHomeData(
		attendance.data,
		history.data ?? {},
		schedule.data ?? [],
		target,
	);
	const projection = projectAttendance(
		data.totalPresent,
		data.totalHeld,
		data.targetPercentage,
	);
	const firstName = data.studentName.split(" ")[0];

	return (
		<ScreenScroll
			refreshing={attendance.isRefetching}
			onRefresh={() => attendance.refetch()}
		>
			<View style={styles.header}>
				<View style={styles.headerText}>
					<Text style={styles.hello} numberOfLines={1}>
						Hello, {firstName}
					</Text>
					<Text style={styles.date}>{formatLongDate(data.today)}</Text>
				</View>
				<View style={styles.avatar}>
					<Text style={styles.avatarText}>{initials(data.studentName)}</Text>
				</View>
			</View>

			{history.data ? (
				<>
					<WeeklySummary week={data.week} todayIndex={data.todayIndex} />
					<AttendanceRing
						present={data.totalPresent}
						total={data.totalHeld}
						target={data.targetPercentage}
						projection={projection}
					/>
					<StreakCard days={data.streakDays} best={data.bestStreak} />
					<WeeklyBarChart week={data.week} todayIndex={data.todayIndex} />
				</>
			) : (
				<>
					<AttendanceRing
						present={data.totalPresent}
						total={data.totalHeld}
						target={data.targetPercentage}
						projection={projection}
					/>
					{history.isError ? (
						<ErrorCard
							message={describeLoadError(history.error)}
							onRetry={() => history.refetch()}
						/>
					) : (
						<LoadingCard message="Loading this week's classes…" />
					)}
				</>
			)}
		</ScreenScroll>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
	},
	headerText: { flex: 1 },
	hello: { fontSize: 26, fontWeight: "800", color: colors.ink },
	date: { fontSize: 13, fontWeight: "600", color: colors.muted, marginTop: 2 },
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.coralTint,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: { fontSize: 15, fontWeight: "800", color: colors.ink },
});
