import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth, useToken } from "@/auth/AuthProvider";
import Card from "@/components/Card";
import { ErrorCard, LoadingCard } from "@/components/Notice";
import ScreenScroll from "@/components/ScreenScroll";
import { useAttendance } from "@/hooks/queries";
import { MAX_TARGET, MIN_TARGET, useTarget } from "@/hooks/useTarget";
import { describeLoadError } from "@/screens/HomeScreen";
import { colors, radius } from "@/theme";

const SOURCE_URL = "https://github.com/dev-himanshu-x/Attendance-cybervidya";

function StepButton({
	icon,
	label,
	onPress,
	disabled,
}: {
	icon: "remove" | "add";
	label: string;
	onPress: () => void;
	disabled: boolean;
}) {
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={[styles.step, disabled && styles.stepDisabled]}
			accessibilityRole="button"
			accessibilityLabel={label}
		>
			<Ionicons name={icon} size={22} color={colors.ink} />
		</Pressable>
	);
}

export default function Profile() {
	const token = useToken();
	const { signOut } = useAuth();
	const { target, setTarget } = useTarget();
	const attendance = useAttendance(token);
	const data = attendance.data;

	return (
		<ScreenScroll>
			<Text style={styles.title}>Profile</Text>

			{attendance.isPending && <LoadingCard message="Loading your profile…" />}
			{attendance.isError && (
				<ErrorCard
					message={describeLoadError(attendance.error)}
					onRetry={() => attendance.refetch()}
				/>
			)}
			{data && (
				<Card style={styles.card}>
					<Text style={styles.name}>{data.fullName}</Text>
					<Text style={styles.line}>{data.registrationNumber}</Text>
					<Text style={styles.line}>
						{data.branchShortName} · Section {data.sectionName}
					</Text>
					<Text style={styles.line}>
						{data.degreeName} · Semester {data.semesterName}
					</Text>
				</Card>
			)}

			<Card style={styles.card}>
				<Text style={styles.cardTitle}>Attendance target</Text>
				<Text style={styles.hint}>
					Used for “can miss” counts and the planner. Not saved between
					launches.
				</Text>
				<View style={styles.stepper}>
					<StepButton
						icon="remove"
						label="Lower target"
						onPress={() => setTarget(target - 1)}
						disabled={target <= MIN_TARGET}
					/>
					<Text style={styles.targetValue}>{target}%</Text>
					<StepButton
						icon="add"
						label="Raise target"
						onPress={() => setTarget(target + 1)}
						disabled={target >= MAX_TARGET}
					/>
				</View>
			</Card>

			<Card style={styles.card}>
				<Link href="/terms" style={styles.linkRow}>
					Terms of Service &amp; Privacy Policy
				</Link>
				<Pressable
					onPress={() => Linking.openURL(SOURCE_URL)}
					accessibilityRole="link"
				>
					<Text style={styles.linkRow}>View source code</Text>
				</Pressable>
				<Text style={styles.disclaimer}>
					Personal project. Not affiliated with KIET or CyberVidya.
				</Text>
			</Card>

			<Pressable
				onPress={signOut}
				style={styles.signOut}
				accessibilityRole="button"
			>
				<Ionicons name="log-out-outline" size={18} color={colors.ink} />
				<Text style={styles.signOutText}>Sign out</Text>
			</Pressable>
		</ScreenScroll>
	);
}

const styles = StyleSheet.create({
	title: { fontSize: 26, fontWeight: "800", color: colors.ink },
	card: { gap: 6 },
	name: { fontSize: 20, fontWeight: "800", color: colors.ink },
	line: { fontSize: 14, fontWeight: "500", color: colors.muted },
	cardTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
	hint: { fontSize: 12, fontWeight: "500", color: colors.muted },
	stepper: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 28,
		marginTop: 8,
	},
	step: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.coralTint,
		alignItems: "center",
		justifyContent: "center",
	},
	stepDisabled: { opacity: 0.4 },
	targetValue: {
		fontSize: 32,
		fontWeight: "800",
		color: colors.ink,
		minWidth: 90,
		textAlign: "center",
	},
	linkRow: {
		fontSize: 15,
		fontWeight: "700",
		color: colors.blue,
		paddingVertical: 8,
	},
	disclaimer: {
		fontSize: 12,
		fontWeight: "500",
		color: colors.muted,
		marginTop: 4,
	},
	signOut: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		backgroundColor: colors.coral,
		borderRadius: radius.pill,
		height: 52,
		marginTop: 4,
	},
	signOutText: { fontSize: 16, fontWeight: "800", color: colors.ink },
});
