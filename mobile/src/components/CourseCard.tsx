import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import Card from "@/components/Card";
import { describeProjection, projectAttendance } from "@/lib/attendance";
import { colors, radius } from "@/theme";
import type { CourseAttendanceInfo } from "@/types/response";

const SIZE = 64;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

function MiniRing({
	percent,
	onTarget,
}: {
	percent: number;
	onTarget: boolean;
}) {
	const clamped = Math.min(Math.max(percent, 0), 100);
	const ringColor = onTarget ? colors.green : colors.coral;
	const trackColor = onTarget ? colors.greenTint : colors.coralTint;
	return (
		<View style={styles.ring}>
			<Svg width={SIZE} height={SIZE}>
				<G rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}>
					<Circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={R}
						stroke={trackColor}
						strokeWidth={STROKE}
						fill="none"
					/>
					<Circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={R}
						stroke={ringColor}
						strokeWidth={STROKE}
						strokeLinecap="round"
						fill="none"
						strokeDasharray={`${C} ${C}`}
						strokeDashoffset={C * (1 - clamped / 100)}
					/>
				</G>
			</Svg>
			<View style={styles.ringCenter} pointerEvents="none">
				<Text style={styles.ringText}>{Math.round(percent)}%</Text>
			</View>
		</View>
	);
}

export default function CourseCard({
	course,
	target,
	onOpen,
}: {
	course: CourseAttendanceInfo;
	target: number;
	onOpen: () => void;
}) {
	const stats = course.attendanceCourseComponentNameInfoList.map((c) => {
		const present = c.numberOfPresent + c.numberOfExtraAttendance;
		return { name: c.componentName, present, total: c.numberOfPeriods };
	});
	const present = stats.reduce((sum, s) => sum + s.present, 0);
	const total = stats.reduce((sum, s) => sum + s.total, 0);
	const percent = total > 0 ? (present / total) * 100 : 0;
	const projection = projectAttendance(present, total, target);
	const safe = projection.status === "safe";

	return (
		<Card>
			<View style={styles.top}>
				<Text style={styles.name}>{course.courseName}</Text>
				<View style={styles.code}>
					<Text style={styles.codeText}>{course.courseCode}</Text>
				</View>
			</View>

			<View style={styles.middle}>
				<MiniRing percent={percent} onTarget={percent >= target} />
				<View style={styles.components}>
					{stats.map((s) => (
						<View key={s.name} style={styles.component}>
							<View style={styles.componentHeader}>
								<Text style={styles.componentName} numberOfLines={1}>
									{s.name}
								</Text>
								<Text style={styles.componentCount}>
									{s.present}/{s.total}
								</Text>
							</View>
							<View style={styles.track}>
								<View
									style={[
										styles.fill,
										{
											width: `${s.total > 0 ? (s.present / s.total) * 100 : 0}%`,
										},
									]}
								/>
							</View>
						</View>
					))}
				</View>
			</View>

			<View style={styles.footer}>
				<View style={styles.status}>
					<Ionicons
						name={safe ? "checkmark-circle" : "alert-circle"}
						size={16}
						color={safe ? colors.blue : colors.coral}
					/>
					<Text style={styles.statusText}>
						{describeProjection(projection)}
					</Text>
				</View>
				<Pressable
					onPress={onOpen}
					style={styles.open}
					accessibilityRole="button"
					accessibilityLabel={`Daywise attendance for ${course.courseName}`}
				>
					<Text style={styles.openText}>Daywise</Text>
					<Ionicons name="chevron-forward" size={14} color={colors.blue} />
				</Pressable>
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	top: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		gap: 8,
		marginBottom: 14,
	},
	name: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.ink },
	code: {
		backgroundColor: colors.blueTint,
		borderRadius: radius.pill,
		paddingVertical: 3,
		paddingHorizontal: 9,
	},
	codeText: { fontSize: 11, fontWeight: "700", color: colors.ink },
	middle: { flexDirection: "row", alignItems: "center", gap: 14 },
	ring: { width: SIZE, height: SIZE },
	ringCenter: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	ringText: { fontSize: 14, fontWeight: "800", color: colors.ink },
	components: { flex: 1, gap: 10 },
	component: { gap: 4 },
	componentHeader: { flexDirection: "row", justifyContent: "space-between" },
	componentName: {
		flex: 1,
		fontSize: 12,
		fontWeight: "600",
		color: colors.muted,
	},
	componentCount: { fontSize: 12, fontWeight: "800", color: colors.ink },
	track: {
		height: 6,
		borderRadius: radius.pill,
		backgroundColor: colors.blueTint,
		overflow: "hidden",
	},
	fill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.blue },
	footer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 14,
		gap: 8,
	},
	status: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
	statusText: {
		flexShrink: 1,
		fontSize: 13,
		fontWeight: "600",
		color: colors.ink,
	},
	open: { flexDirection: "row", alignItems: "center", gap: 2, padding: 4 },
	openText: { fontSize: 13, fontWeight: "800", color: colors.blue },
});
