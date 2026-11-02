"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import App from "@/components/App";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import { AuthTokenProvider } from "@/hooks/useAuthToken";
import { TargetPercentageProvider } from "@/hooks/useTargetPercentage";
import { ThemeProvider } from "@/hooks/useTheme";
import { queryClient } from "@/lib/queryClient";

export default function AppRoot() {
	return (
		<ThemeProvider>
			<QueryClientProvider client={queryClient}>
				<AuthTokenProvider>
					<TargetPercentageProvider>
						<ToastProvider>
							<App />
						</ToastProvider>
					</TargetPercentageProvider>
				</AuthTokenProvider>
			</QueryClientProvider>
		</ThemeProvider>
	);
}
