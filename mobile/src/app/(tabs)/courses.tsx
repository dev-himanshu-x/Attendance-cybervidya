import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useToken } from "@/auth/AuthProvider";
import CourseCard from "@/components/CourseCard";
import { ErrorCard, LoadingCard } from "@/components/Notice";
import ScreenScroll from "@/components/ScreenScroll";
import { useAttendance } from "@/hooks/queries";
import { useTarget } from "@/hooks/useTarget";
import { describeLoadError } from "@/screens/HomeScreen";
import { colors } from "@/theme";

export default function Courses() {
	const token = useToken();
	const router = useRouter();
	const { target } = useTarget();
	const attendance = useAttendance(token);
	const [query, setQuery] = useState("");

	const courses = useMemo(() => {
		const list = attendance.data?.attendanceCourseComponentInfoList ?? [];
		const q = query.trim().toLowerCase();
		if (!q) return list;
		return list.filter(
			(c) =>
				c.courseName.toLowerCase().includes(q) ||
				c.courseCode.toLowerCase().includes(q),
		);
	}, [attendance.data, query]);

	return (
		<ScreenScroll
			refreshing={attendance.isRefetching}
			onRefresh={() => attendance.refetch()}
		>
			<Text style={styles.title}>Courses</Text>
			<View style={styles.search}>
				<Ionicons name="search" size={18} color={colors.muted} />
				<TextInput
					style={styles.searchInput}
					value={query}
					onChangeText={setQuery}
					placeholder="Search courses"
					placeholderTextColor={colors.muted}
					autoCapitalize="none"
					autoCorrect={false}
					clearButtonMode="while-editing"
					accessibilityLabel="Search courses"
				/>
			</View>

			{attendance.isPending && <LoadingCard message="Loading your courses…" />}
			{attendance.isError && (
				<ErrorCard
					message={describeLoadError(attendance.error)}
					onRetry={() => attendance.refetch()}
				/>
			)}
			{attendance.data && courses.length === 0 && (
				<Text style={styles.empty}>
					{query.trim()
						? `No courses match “${query.trim()}”.`
						: "No courses yet."}
				</Text>
			)}
			{courses.map((course) => (
				<CourseCard
					key={course.courseCode}
					course={course}
					target={target}
					onOpen={() =>
						router.push({
							pathname: "/course/[id]",
							params: { id: String(course.courseId) },
						})
					}
				/>
			))}
		</ScreenScroll>
	);
}

const styles = StyleSheet.create({
	title: { fontSize: 26, fontWeight: "800", color: colors.ink },
	search: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: colors.card,
		borderRadius: 16,
		paddingHorizontal: 14,
		borderWidth: 1,
		borderColor: colors.hairline,
	},
	searchInput: {
		flex: 1,
		paddingVertical: 12,
		fontSize: 15,
		color: colors.ink,
	},
	empty: {
		textAlign: "center",
		fontSize: 14,
		fontWeight: "600",
		color: colors.muted,
		paddingVertical: 24,
	},
});
