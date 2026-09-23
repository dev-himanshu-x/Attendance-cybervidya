import { useQueryClient } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState } from "react";
import Attendance from "./components/attendance/Attendance";
import LoginForm from "./components/auth/LoginForm";
import TnC from "./components/auth/TnC";
import AppHeader from "./components/layout/AppHeader";
import ExtensionUpdateNotice from "./components/layout/ExtensionUpdateNotice";
import Footer from "./components/layout/Footer";
import { useAuthToken } from "./hooks/useAuthToken";
import { useToast } from "./hooks/useToast";
import {
	attendanceQueryKey,
	useAttendanceQuery,
} from "./queries/useAttendanceQuery";
import { STUDENT_ID_COOKIE_NAME } from "./types/constants";

function App() {
	const { token, setToken, clearToken } = useAuthToken();
	const queryClient = useQueryClient();
	const toast = useToast();

	const [isTnCVisible, setIsTnCVisible] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState("");
	const hasHandledUrlTokenRef = useRef<boolean>(false);

	const attendanceQuery = useAttendanceQuery(token);

	useEffect(() => {
		if (hasHandledUrlTokenRef.current) return;
		const searchParams = new URLSearchParams(window.location.search);
		const urlToken = searchParams.get("token");

		if (urlToken) {
			hasHandledUrlTokenRef.current = true;
			// The extension's DNR ruleset rewrites request headers so the
			// ERP accepts calls originating from this app.
			window.history.replaceState({}, document.title, window.location.pathname);
			setToken(urlToken, 7);
		}
	}, [setToken]);

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

	return (
		<div className="app-shell">
			<AppHeader
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onLogout={attendanceQuery.data ? handleLogout : undefined}
			/>
			<ExtensionUpdateNotice />
			<div className="app-main">
				{!attendanceQuery.data ? (
					isTnCVisible ? (
						<TnC setIsTnCVisible={setIsTnCVisible} />
					) : (
						<LoginForm />
					)
				) : (
					<Attendance searchQuery={searchQuery} />
				)}
			</div>
			<Footer />
			<Analytics />
		</div>
	);
}

export default App;
