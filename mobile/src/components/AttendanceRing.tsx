import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line } from "react-native-svg";
import Card from "@/components/Card";
import { type Projection, percentage } from "@/lib/attendance";
import { colors, radius } from "@/theme";

const SIZE = 124;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function StatusChip({ projection }: { projection: Projection }) {
	if (projection.status === "empty") return null;
	const safe = projection.status === "safe";
	const text = safe
		? projection.canMiss > 0
			? `Can miss ${projection.canMiss} class${projection.canMiss === 1 ? "" : "es"}`
			: "On target · don't miss any"
		: `Attend next ${projection.needToAttend} class${projection.needToAttend === 1 ? "" : "es"}`;
	return (
		<View
			style={[
				styles.chip,
				{ backgroundColor: safe ? colors.blueTint : colors.coralTint },
			]}
		>
			<Ionicons
				name={safe ? "checkmark-circle" : "alert-circle"}
				size={16}
				color={safe ? colors.blue : colors.coral}
			/>
			<Text style={styles.chipText}>{text}</Text>
		</View>
	);
}

export default function AttendanceRing({
	present,
	total,
	target,
	projection,
}: {
	present: number;
	total: number;
	target: number;
	projection: Projection;
}) {
	const pct = percentage(present, total);
	const clamped = Math.min(Math.max(pct, 0), 100);
	// Green at or above the target, coral below it.
	const onTarget = pct >= target;
	const ringColor = onTarget ? colors.green : colors.coral;
	const trackColor = onTarget ? colors.greenTint : colors.coralTint;

	// Target tick: a short blue mark across the ring at the target angle.
	const angle = (target / 100) * 2 * Math.PI - Math.PI / 2;
	const inner = RADIUS - STROKE / 2 - 3;
	const outer = RADIUS + STROKE / 2 + 3;
	const tick = {
		x1: CENTER + inner * Math.cos(angle),
		y1: CENTER + inner * Math.sin(angle),
		x2: CENTER + outer * Math.cos(angle),
		y2: CENTER + outer * Math.sin(angle),
	};

	return (
		<Card style={styles.card}>
			<View
				style={styles.ringWrap}
				accessible
				accessibilityLabel={`Overall attendance ${Math.round(pct)} percent, target ${target} percent`}
			>
				<Svg width={SIZE} height={SIZE}>
					<G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
						<Circle
							cx={CENTER}
							cy={CENTER}
							r={RADIUS}
							stroke={trackColor}
							strokeWidth={STROKE}
							fill="none"
						/>
						<Circle
							cx={CENTER}
							cy={CENTER}
							r={RADIUS}
							stroke={ringColor}
							strokeWidth={STROKE}
							strokeLinecap="round"
							fill="none"
							strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
							strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
						/>
					</G>
					<Line
						{...tick}
						stroke={colors.blue}
						strokeWidth={3}
						strokeLinecap="round"
					/>
				</Svg>
				<View style={styles.center} pointerEvents="none">
					<Text style={styles.pct}>{Math.round(pct)}%</Text>
					<Text style={styles.pctLabel}>attended</Text>
				</View>
			</View>

			<View style={styles.info}>
				<Text style={styles.title}>Overall attendance</Text>
				<Text style={styles.count}>
					{present} of {total} classes
				</Text>
				<View style={styles.targetRow}>
					<View style={styles.targetTick} />
					<Text style={styles.targetText}>Target {target}%</Text>
				</View>
				<StatusChip projection={projection} />
			</View>
		</Card>
	);
}

const styles = StyleSheet.create({
	card: { flexDirection: "row", alignItems: "center", gap: 16 },
	ringWrap: { width: SIZE, height: SIZE },
	center: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	pct: { fontSize: 30, fontWeight: "800", color: colors.ink },
	pctLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
	info: { flex: 1, gap: 6 },
	title: { fontSize: 16, fontWeight: "700", color: colors.ink },
	count: { fontSize: 13, fontWeight: "600", color: colors.muted },
	targetRow: { flexDirection: "row", alignItems: "center", gap: 6 },
	targetTick: {
		width: 3,
		height: 14,
		borderRadius: 2,
		backgroundColor: colors.blue,
	},
	targetText: { fontSize: 13, fontWeight: "600", color: colors.muted },
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		alignSelf: "flex-start",
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: radius.pill,
		marginTop: 2,
	},
	chipText: {
		flexShrink: 1,
		fontSize: 12,
		fontWeight: "700",
		color: colors.ink,
	},
});
