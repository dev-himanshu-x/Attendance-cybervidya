import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useToken } from "@/auth/AuthProvider";
import Card from "@/components/Card";
import { ErrorCard, LoadingCard } from "@/components/Notice";
import ScreenScroll from "@/components/ScreenScroll";
import {
	useAttendance,
	useCourseLectures,
	useStudentId,
} from "@/hooks/queries";
import { formatShortDate } from "@/lib/dates";
import { describeLoadError } from "@/screens/HomeScreen";
import { colors, radius } from "@/theme";
import type { LectureListProps } from "@/types/response";

const STATUS_STYLE: Record<
	LectureListProps["attendance"],
	{ bg: string; icon: "checkmark" | "remove" | "close"; label: string }
> = {
	PRESENT: { bg: colors.blueTint, icon: "checkmark", label: "Present" },
	ADJUSTED: { bg: colors.hairline, icon: "remove", label: "Adjusted" },
	ABSENT: { bg: colors.coralTint, icon: "close", label: "Absent" },
};

export default function CourseDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const token = useToken();
	const attendance = useAttendance(token);
	const studentId = useStudentId(token);
	const [selected, setSelected] = useState(0);

	const course = attendance.data?.attendanceCourseComponentInfoList.find(
		(c) => String(c.courseId) === id,
	);
	const components = course?.attendanceCourseComponentNameInfoList ?? [];
	const component = components[Math.min(selected, components.length - 1)];

	const lectures = useCourseLectures(
		token,
		course && component && studentId.data
			? {
					courseCompId: component.courseComponentId,
					courseId: course.courseId,
					sessionId: null,
					studentId: studentId.data,
				}
			: null,
	);
	const sorted = [...(lectures.data ?? [])].sort(
		(a, b) =>
			new Date(b.planLecDate).getTime() - new Date(a.planLecDate).getTime(),
	);

	return (
		<ScreenScroll>
			<Pressable
				onPress={() => router.back()}
				style={styles.back}
				accessibilityRole="button"
				accessibilityLabel="Back"
			>
				<Ionicons name="chevron-back" size={20} color={colors.blue} />
				<Text style={styles.backText}>Courses</Text>
			</Pressable>

			{course ? (
				<>
					<View>
						<Text style={styles.title}>{course.courseName}</Text>
						<Text style={styles.code}>{course.courseCode}</Text>
					</View>

					{components.length > 1 && (
						<View style={styles.segments}>
							{components.map((c, i) => (
								<Pressable
									key={c.courseComponentId}
									onPress={() => setSelected(i)}
									style={[styles.segment, i === selected && styles.segmentOn]}
									accessibilityRole="button"
									accessibilityState={{ selected: i === selected }}
								>
									<Text
										style={[
											styles.segmentText,
											i === selected && styles.segmentTextOn,
										]}
									>
										{c.componentName}
									</Text>
								</Pressable>
							))}
						</View>
					)}

					{lectures.isPending && !!studentId.data && (
						<LoadingCard message="Loading daywise attendance…" />
					)}
					{lectures.isError && (
						<ErrorCard
							message={`${describeLoadError(lectures.error)} (Or this subject has no classes yet.)`}
							onRetry={() => lectures.refetch()}
						/>
					)}
					{lectures.data && sorted.length === 0 && (
						<Text style={styles.empty}>No daywise attendance yet.</Text>
					)}
					{sorted.length > 0 && (
						<Card style={styles.list}>
							{sorted.map((lecture, i) => {
								const s = STATUS_STYLE[lecture.attendance];
								return (
									<View
										key={`${lecture.planLecDate}-${lecture.timeSlot}`}
										style={[styles.row, i > 0 && styles.rowDivider]}
									>
										<View style={styles.rowMain}>
											<Text style={styles.rowDate}>
												{formatShortDate(lecture.planLecDate)}
											</Text>
											<Text style={styles.rowSub}>
												{lecture.dayName} · {lecture.timeSlot}
											</Text>
										</View>
										<View style={[styles.chip, { backgroundColor: s.bg }]}>
											<Ionicons name={s.icon} size={13} color={colors.ink} />
											<Text style={styles.chipText}>{s.label}</Text>
										</View>
									</View>
								);
							})}
						</Card>
					)}
				</>
			) : (
				<Text style={styles.empty}>Course not found.</Text>
			)}
		</ScreenScroll>
	);
}

const styles = StyleSheet.create({
	back: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
	backText: { fontSize: 15, fontWeight: "700", color: colors.blue },
	title: { fontSize: 24, fontWeight: "800", color: colors.ink },
	code: { fontSize: 13, fontWeight: "700", color: colors.muted, marginTop: 2 },
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
	list: { paddingVertical: 4 },
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		gap: 8,
	},
	rowDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
	rowMain: { flex: 1 },
	rowDate: { fontSize: 14, fontWeight: "700", color: colors.ink },
	rowSub: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.muted,
		marginTop: 2,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		borderRadius: radius.pill,
		paddingVertical: 4,
		paddingHorizontal: 10,
	},
	chipText: { fontSize: 12, fontWeight: "700", color: colors.ink },
	empty: {
		textAlign: "center",
		fontSize: 14,
		fontWeight: "600",
		color: colors.muted,
		paddingVertical: 24,
	},
});
