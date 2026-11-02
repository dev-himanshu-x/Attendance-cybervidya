import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { View } from "react-native";
import { isBlockedStatus } from "@/api/http";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import DataBridge from "@/components/DataBridge";
import { TargetProvider } from "@/hooks/useTarget";
import { colors } from "@/theme";

function RootNavigator() {
	const { state } = useAuth();

	// Wait for the stored session to load so the guards below don't bounce a
	// signed-in student through the login screen.
	if (state.status === "loading") {
		return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
	}
	const signedIn = state.status === "signedIn";

	return (
		<>
			{/* Hidden browser view that carries every API call (see api/bridge.ts). */}
			{signedIn && <DataBridge />}
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: colors.cream },
				}}
			>
				<Stack.Protected guard={signedIn}>
					<Stack.Screen name="(tabs)" />
					<Stack.Screen name="course/[id]" />
				</Stack.Protected>
				<Stack.Protected guard={!signedIn}>
					<Stack.Screen name="login" />
				</Stack.Protected>
				<Stack.Screen name="terms" />
			</Stack>
		</>
	);
}

export default function RootLayout() {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// Never retry a refusal — repeating a blocked request is what
						// gets accounts flagged.
						retry: (count, err) => !isBlockedStatus(err) && count < 1,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<TargetProvider>
					<StatusBar style="dark" />
					<RootNavigator />
				</TargetProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}
