import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { BASE_URL } from "@/api/http";
import { useAuth } from "@/auth/AuthProvider";
import Card from "@/components/Card";
import { colors, radius, spacing } from "@/theme";

// The student signs in on CyberVidya's own page, inside a genuine browser
// view, so their password goes only to CyberVidya — this app never sees it.
// After a successful sign-in the page stores the session token in
// localStorage; this script watches for it and hands just the token to the
// app. Same mechanism the project's browser extension uses.
const TOKEN_WATCHER = `
(function () {
	if (window.__tokenWatcher) return;
	window.__tokenWatcher = true;
	var timer = setInterval(function () {
		try {
			var raw = window.localStorage.getItem("authenticationtoken");
			if (!raw) return;
			var token = raw.replace(/^"|"$/g, "");
			if (token.length < 20) return;
			clearInterval(timer);
			window.ReactNativeWebView.postMessage(
				JSON.stringify({ type: "token", token: token })
			);
		} catch (e) {}
	}, 500);
})();
true;
`;

function SignInWebView({ onCancel }: { onCancel: () => void }) {
	const insets = useSafeAreaInsets();
	const { signIn } = useAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const handled = useRef(false);

	function onMessage(event: WebViewMessageEvent) {
		// Only accept the token from CyberVidya's own page.
		if (!event.nativeEvent.url.startsWith(BASE_URL) || handled.current) return;
		try {
			const message = JSON.parse(event.nativeEvent.data);
			if (message.type === "token" && typeof message.token === "string") {
				handled.current = true;
				signIn(message.token);
			}
		} catch {
			// Ignore anything that isn't our own message.
		}
	}

	return (
		<View style={[styles.webRoot, { paddingTop: insets.top }]}>
			<View style={styles.webBar}>
				<Pressable
					onPress={onCancel}
					hitSlop={12}
					accessibilityRole="button"
					accessibilityLabel="Cancel sign in"
				>
					<Text style={styles.cancel}>Cancel</Text>
				</Pressable>
				<View style={styles.secure}>
					<Ionicons name="lock-closed" size={13} color={colors.muted} />
					<Text style={styles.secureText}>kiet.cybervidya.net</Text>
				</View>
				<View style={styles.barSpacer} />
			</View>

			{error !== "" && (
				<View style={styles.webError} accessibilityRole="alert">
					<Ionicons name="alert-circle" size={18} color={colors.coral} />
					<Text style={styles.webErrorText}>{error}</Text>
				</View>
			)}

			<View style={styles.webWrap}>
				<WebView
					source={{ uri: BASE_URL }}
					style={styles.web}
					// A fresh, non-persistent browser session: nothing from the
					// CyberVidya site is left on the phone after sign-in.
					incognito
					injectedJavaScript={TOKEN_WATCHER}
					onMessage={onMessage}
					onLoadStart={() => setLoading(true)}
					onLoadEnd={() => setLoading(false)}
					// Stay on CyberVidya's site.
					onShouldStartLoadWithRequest={(request) =>
						request.url.startsWith(BASE_URL) || request.url === "about:blank"
					}
					onHttpError={(e) =>
						setError(
							e.nativeEvent.statusCode === 403
								? "CyberVidya's firewall refused this page (403)."
								: `CyberVidya replied with an error (${e.nativeEvent.statusCode}).`,
						)
					}
					onError={() =>
						setError("Can't reach CyberVidya. Check your connection.")
					}
				/>
				{loading && (
					<View style={styles.loading} pointerEvents="none">
						<ActivityIndicator color={colors.coral} size="large" />
					</View>
				)}
			</View>
		</View>
	);
}

export default function LoginScreen() {
	const insets = useSafeAreaInsets();
	const [signingIn, setSigningIn] = useState(false);

	if (signingIn) return <SignInWebView onCancel={() => setSigningIn(false)} />;

	return (
		<ScrollView
			style={styles.flex}
			contentContainerStyle={[
				styles.content,
				{ paddingTop: insets.top + 64, paddingBottom: insets.bottom + 24 },
			]}
		>
			<View style={styles.brand}>
				<View style={styles.logo}>
					<Ionicons name="calendar" size={26} color="#FFFFFF" />
				</View>
				<Text style={styles.title}>Welcome back</Text>
				<Text style={styles.subtitle}>
					See your attendance, schedule and what-if plans in one place.
				</Text>
			</View>

			<Card style={styles.card}>
				<View style={styles.point}>
					<Ionicons name="shield-checkmark" size={20} color={colors.blue} />
					<Text style={styles.pointText}>
						You sign in on CyberVidya's own page. Your password goes only to
						CyberVidya — this app never sees it.
					</Text>
				</View>
				<Pressable
					onPress={() => setSigningIn(true)}
					style={styles.button}
					accessibilityRole="button"
				>
					<Text style={styles.buttonText}>Sign in with CyberVidya</Text>
				</Pressable>
			</Card>

			<View style={styles.footer}>
				<Text style={styles.note}>Not affiliated with KIET or CyberVidya.</Text>
				<Link href="/terms" style={styles.link}>
					Terms &amp; privacy
				</Link>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1, backgroundColor: colors.cream },
	content: { paddingHorizontal: spacing.screen, gap: 24 },
	brand: { alignItems: "center", gap: 8 },
	logo: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: colors.coral,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 6,
	},
	title: { fontSize: 28, fontWeight: "800", color: colors.ink },
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
		color: colors.muted,
		textAlign: "center",
		paddingHorizontal: 12,
	},
	card: { gap: 16 },
	point: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
	pointText: {
		flex: 1,
		fontSize: 14,
		fontWeight: "500",
		lineHeight: 20,
		color: colors.ink,
	},
	button: {
		backgroundColor: colors.coral,
		borderRadius: radius.pill,
		height: 52,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: { fontSize: 16, fontWeight: "800", color: colors.ink },
	footer: { alignItems: "center", gap: 8 },
	note: { fontSize: 12, fontWeight: "500", color: colors.muted },
	link: { fontSize: 13, fontWeight: "700", color: colors.blue },

	webRoot: { flex: 1, backgroundColor: colors.cream },
	webBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: spacing.screen,
		paddingVertical: 12,
	},
	cancel: { fontSize: 15, fontWeight: "700", color: colors.blue, minWidth: 60 },
	barSpacer: { minWidth: 60 },
	secure: { flexDirection: "row", alignItems: "center", gap: 5 },
	secureText: { fontSize: 13, fontWeight: "600", color: colors.muted },
	webError: {
		flexDirection: "row",
		gap: 8,
		alignItems: "center",
		backgroundColor: colors.coralTint,
		padding: 12,
		marginHorizontal: spacing.screen,
		marginBottom: 8,
		borderRadius: 14,
	},
	webErrorText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.ink },
	webWrap: { flex: 1 },
	web: { flex: 1, backgroundColor: colors.card },
	loading: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: "center",
		justifyContent: "center",
	},
});
