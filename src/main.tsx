import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ToastProvider } from "./components/ui/toast/ToastProvider.tsx";
import { AuthTokenProvider } from "./hooks/useAuthToken.tsx";
import { TargetPercentageProvider } from "./hooks/useTargetPercentage.tsx";
import { ThemeProvider } from "./hooks/useTheme.tsx";
import { queryClient } from "./lib/queryClient.ts";
import "./styles/main.css";

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
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
	</StrictMode>,
);
