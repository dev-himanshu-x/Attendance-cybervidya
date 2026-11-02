import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "@/components/Card";
import ScreenScroll from "@/components/ScreenScroll";
import { colors } from "@/theme";

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<Card style={styles.section}>
			<Text style={styles.heading}>{title}</Text>
			{children}
		</Card>
	);
}

function P({ children }: { children: ReactNode }) {
	return <Text style={styles.body}>{children}</Text>;
}

function Bullet({ children }: { children: ReactNode }) {
	return (
		<View style={styles.bullet}>
			<Text style={styles.body}>•</Text>
			<Text style={[styles.body, styles.bulletText]}>{children}</Text>
		</View>
	);
}

const B = ({ children }: { children: ReactNode }) => (
	<Text style={styles.bold}>{children}</Text>
);

// Adapted from the website's Terms of Service & Privacy Policy for the mobile
// app (phone instead of browser, device keychain instead of cookies).
export default function Terms() {
	const router = useRouter();
	return (
		<ScreenScroll>
			<Pressable
				onPress={() => router.back()}
				style={styles.back}
				accessibilityRole="button"
				accessibilityLabel="Back"
			>
				<Ionicons name="chevron-back" size={20} color={colors.blue} />
				<Text style={styles.backText}>Back</Text>
			</Pressable>

			<View>
				<Text style={styles.title}>Terms of Service &amp; Privacy Policy</Text>
				<Text style={styles.updated}>Last updated: 2 November 2026</Text>
			</View>

			<Card style={[styles.section, styles.disclaimer]}>
				<Text style={styles.heading}>
					Strictly personal project — disclaimer
				</Text>
				<P>
					<B>Please read this carefully before proceeding.</B>
				</P>
				<P>
					This Application is a <B>personal project</B> created solely for the
					private use of its developer/creator. It is <B>not</B> an official
					product of CyberVidya.
				</P>
				<P>
					While the source code is hosted publicly (for example on GitHub) for
					educational and portfolio purposes,{" "}
					<B>
						the creator assumes no responsibility for its use, distribution or
						modification by any third party.
					</B>
				</P>
				<P>
					If you are not the creator and you choose to use this Application, you
					do so entirely at your own risk. The creator expressly disclaims any
					liability for any consequences resulting from your use of this
					software.
				</P>
			</Card>

			<Section title="1. Nature of the application">
				<P>
					This Application is a client-side interface designed to facilitate
					access to attendance data.
				</P>
				<Bullet>
					<B>No server-side storage:</B> we do not store your passwords or
					academic records on any server.
				</Bullet>
				<Bullet>
					<B>Direct connection:</B> your phone talks to CyberVidya directly,
					through an in-app browser view of CyberVidya's own website. Nothing
					passes through any server of ours.
				</Bullet>
				<Bullet>
					<B>Open source:</B> the code is open source, allowing transparency.
					However, this transparency does not constitute a licence for
					unauthorised public deployment or commercial use.
				</Bullet>
			</Section>

			<Section title="2. Limitation of liability & indemnification">
				<P>
					<B>To the fullest extent permitted by Indian law:</B>
				</P>
				<Bullet>
					The creator shall not be liable for any direct, indirect, incidental,
					special, consequential or exemplary damages, including damages for
					loss of profits, goodwill, use, data or other intangible losses.
				</Bullet>
				<Bullet>
					The creator is not responsible for any legal disputes, academic
					penalties or administrative actions taken against you by your
					institution or CyberVidya arising from your use of this tool.
				</Bullet>
				<Bullet>
					<B>Unauthorised distribution:</B> if this Application is shared,
					hosted or distributed by third parties without the creator's explicit
					consent, the creator holds no responsibility for such actions. Anyone
					using such third-party distributions does so at their own peril.
				</Bullet>
			</Section>

			<Section title="3. Compliance with Indian laws">
				<P>
					This project is created with the intent of purely personal utility and
					educational experimentation, protected under the principles of fair
					dealing/fair use.
				</P>
				<P>
					<B>Notice to CyberVidya:</B>
				</P>
				<Text style={[styles.body, styles.quote]}>
					“This software acts as a user-agent (mobile application/interface)
					that automates the retrieval of data that the user is already
					authorised to access via their official credentials. It does not
					bypass authentication, does not hack into servers, and does not access
					data of other users. It strictly operates within the scope of the
					user's own authorised session. Any legal notice regarding this
					personal project should be directed to the creator for amicable
					resolution, acknowledging that this is a non-commercial, student-made
					utility.”
				</Text>
			</Section>

			<Section title="4. Data privacy">
				<P>Since the project is designed for personal use:</P>
				<Bullet>
					<B>Credentials:</B> your credentials are sent only to the official
					ERP. We do not see them, and your password is not saved on your phone.
				</Bullet>
				<Bullet>
					<B>Local storage:</B> your sign-in session token is kept on your phone
					in the system's secure storage (iOS Keychain / Android Keystore) until
					you sign out or it expires.
				</Bullet>
			</Section>

			<Section title="5. Third-party services">
				<P>
					This Application interacts with the API provided by <B>CyberVidya</B>.
					We claim no ownership over the data provided by their service. All
					rights to the attendance data and institutional records belong to
					CyberVidya.
				</P>
			</Section>

			<Text style={styles.footer}>
				By using this software, you confirm that you have read, understood and
				agreed to these terms. If you do not agree, you must stop using this
				Application immediately.
			</Text>
		</ScreenScroll>
	);
}

const styles = StyleSheet.create({
	back: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
	backText: { fontSize: 15, fontWeight: "700", color: colors.blue },
	title: { fontSize: 24, fontWeight: "800", color: colors.ink },
	updated: {
		fontSize: 12,
		fontWeight: "600",
		color: colors.muted,
		marginTop: 4,
	},
	section: { gap: 8 },
	disclaimer: { backgroundColor: colors.coralTint },
	heading: { fontSize: 16, fontWeight: "800", color: colors.ink },
	body: { fontSize: 14, lineHeight: 21, fontWeight: "500", color: colors.ink },
	bold: { fontWeight: "800" },
	bullet: { flexDirection: "row", gap: 8 },
	bulletText: { flex: 1 },
	quote: {
		backgroundColor: colors.cream,
		borderRadius: 14,
		padding: 14,
		fontSize: 13,
		fontStyle: "italic",
	},
	footer: {
		fontSize: 12,
		fontWeight: "500",
		fontStyle: "italic",
		color: colors.muted,
		textAlign: "center",
		lineHeight: 18,
	},
});
