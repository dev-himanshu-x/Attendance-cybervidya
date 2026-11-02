import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

// Cream scrolling page with safe-area padding, shared by every screen.
export default function ScreenScroll({
	children,
	refreshing,
	onRefresh,
}: {
	children: ReactNode;
	refreshing?: boolean;
	onRefresh?: () => void;
}) {
	const insets = useSafeAreaInsets();
	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={[
				styles.content,
				{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
			]}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
			refreshControl={
				onRefresh ? (
					<RefreshControl
						refreshing={!!refreshing}
						onRefresh={onRefresh}
						tintColor={colors.coral}
					/>
				) : undefined
			}
		>
			{children}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.cream },
	content: { paddingHorizontal: spacing.screen, gap: spacing.gap },
});
