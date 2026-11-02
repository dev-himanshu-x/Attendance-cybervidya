import { useEffect, useState } from "react";
import { EXTENSION_MARKER_ID } from "@/api/extensionBridge";

export type ExtensionStatus = "checking" | "installed" | "missing";

// How long to wait for the extension's page marker before calling it missing:
// it is injected shortly after the page loads.
const GRACE_MS = 300;

// Whether this browser has the Attendance Bridge extension. Starts as
// "checking" so nothing flashes up for people who do have it.
export function useExtensionStatus(): ExtensionStatus {
	// Looks straight away: the page is client-only, and the extension's marker is
	// normally there before the first render, so nothing flashes for those who
	// have it.
	const [status, setStatus] = useState<ExtensionStatus>(() =>
		typeof document !== "undefined" &&
		document.getElementById(EXTENSION_MARKER_ID)
			? "installed"
			: "checking",
	);

	useEffect(() => {
		const startedAt = Date.now();
		const check = () => {
			if (document.getElementById(EXTENSION_MARKER_ID)) {
				setStatus("installed");
			} else if (Date.now() - startedAt > GRACE_MS) {
				setStatus("missing");
			}
		};
		check();
		const timer = setInterval(check, 500);
		return () => clearInterval(timer);
	}, []);

	return status;
}

// Firefox and Zen (a Firefox browser) take the Firefox build.
export function isFirefoxFamily(): boolean {
	return (
		typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent)
	);
}
