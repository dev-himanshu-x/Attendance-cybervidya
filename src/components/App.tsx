"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/next";
import Cookies from "js-cookie";
import { useCallback, useEffect, useState } from "react";
import Attendance from "@/components/attendance/Attendance";
import LoginForm from "@/components/auth/LoginForm";
import TnC from "@/components/auth/TnC";
import Footer from "@/components/layout/Footer";
import MaintenancePage from "@/components/layout/MaintenancePage";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useToast } from "@/hooks/useToast";
import {
	attendanceQueryKey,
	useAttendanceQuery,
} from "@/queries/useAttendanceQuery";
import { STUDENT_ID_COOKIE_NAME } from "@/types/constants";

// CyberVidya is blocking requests from every relay we've tried; flip this
// back to false once a working path to the ERP is restored.
const MAINTENANCE_MODE = true;

function App() {
	const { token, clearToken } = useAuthToken();
	const queryClient = useQueryClient();
	const toast = useToast();

	const [isTnCVisible, setIsTnCVisible] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState("");

	const attendanceQuery = useAttendanceQuery(token);

	useEffect(() => {
		// Target percentage is no longer persisted; drop any leftover cookie.
		Cookies.remove("target_percentage");
	}, []);

	useEffect(() => {
		if (attendanceQuery.isError) {
			const message =
				attendanceQuery.error instanceof Error
					? attendanceQuery.error.message
					: "Failed to load attendance data.";
			toast.error(message);
			if (message === "Session expired. Please login again.") {
				clearToken();
			}
		}
	}, [attendanceQuery.isError, attendanceQuery.error, toast, clearToken]);

	const handleLogout = useCallback(() => {
		queryClient.removeQueries({ queryKey: attendanceQueryKey(token) });
		clearToken();
		Cookies.remove(STUDENT_ID_COOKIE_NAME);
	}, [queryClient, token, clearToken]);

	const isAuthenticated = !!attendanceQuery.data;
	// The dashboard carries its own inline theme toggle in its top bar;
	// everywhere else (login, terms) gets the floating one.
	const showFloatingToggle = isTnCVisible || !isAuthenticated;

	if (MAINTENANCE_MODE) {
		return (
			<div className="app-shell">
				<ThemeToggle floating />
				<div className="app-main">
					<MaintenancePage />
				</div>
				<Footer onShowTerms={() => setIsTnCVisible(true)} />
				<Analytics />
			</div>
		);
	}

	return (
		<div className="app-shell">
			{showFloatingToggle && <ThemeToggle floating />}
			<div className="app-main">
				{isTnCVisible ? (
					<TnC setIsTnCVisible={setIsTnCVisible} />
				) : isAuthenticated ? (
					<Attendance
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						onLogout={handleLogout}
					/>
				) : (
					<LoginForm />
				)}
			</div>
			<Footer onShowTerms={() => setIsTnCVisible(true)} />
			<Analytics />
		</div>
	);
}

export default App;
