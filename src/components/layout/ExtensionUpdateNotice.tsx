import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { REQUIRED_EXTENSION_VERSION } from "../../types/constants";
import AlertBanner from "../ui/AlertBanner";

const DISMISS_KEY = "extension_update_notice_dismissed";

function isVersionOutdated(version: string | null): boolean {
	if (!version) return true; // Old extensions do not report a version
	const current = version.split(".").map(Number);
	const required = REQUIRED_EXTENSION_VERSION.split(".").map(Number);
	for (let i = 0; i < required.length; i++) {
		const currentPart = current[i] ?? 0;
		const requiredPart = required[i];
		if (currentPart < requiredPart) return true;
		if (currentPart > requiredPart) return false;
	}
	return false;
}

function ExtensionUpdateNotice() {
	const [installedVersion, setInstalledVersion] = useState<string | null>(null);
	const [isOutdated, setIsOutdated] = useState<boolean>(false);
	const [dismissed, setDismissed] = useState<boolean>(
		() => sessionStorage.getItem(DISMISS_KEY) === "true",
	);

	useEffect(() => {
		const checkExtension = () => {
			const marker = document.getElementById("kiet-extension-installed");
			if (marker) {
				const version = marker.getAttribute("data-version");
				setInstalledVersion(version);
				setIsOutdated(isVersionOutdated(version));
			}
		};

		checkExtension();
		const interval = setInterval(checkExtension, 1000); // Check periodically
		return () => clearInterval(interval);
	}, []);

	if (!isOutdated || dismissed) return null;

	const handleDismiss = () => {
		sessionStorage.setItem(DISMISS_KEY, "true");
		setDismissed(true);
	};

	return (
		<AlertBanner variant="warning">
			<AlertTriangle className="flex-shrink-0 mt-1" size={22} />
			<div style={{ fontSize: "0.875rem" }}>
				<p className="fw-bold mb-0">
					Extension update required
					{installedVersion ? ` (you have v${installedVersion})` : ""}
				</p>
				<p className="mt-1 mb-0">
					You are using an outdated version of the{" "}
					<strong>KIET Auth Bridge</strong> extension. Please remove it and
					install the latest version (v
					{REQUIRED_EXTENSION_VERSION}) to continue using the app:
				</p>
				<ol className="mt-2 mb-0 ps-3">
					<li>
						Remove the old extension — Chrome: <code>chrome://extensions</code>{" "}
						· Firefox: <code>about:addons</code>
					</li>
					<li>Download and install the latest version:</li>
				</ol>
				<div className="d-flex flex-wrap gap-2 mt-2">
					<a
						href="https://github.com/AmanDevelops/attendance-kiet/releases/latest/download/chrome.zip"
						className="btn-brutal btn-brutal--outline"
					>
						Chrome / Edge / Brave
					</a>
					<a
						href="https://github.com/AmanDevelops/attendance-kiet/releases/latest/download/firefox.xpi"
						className="btn-brutal btn-brutal--outline"
					>
						Firefox
					</a>
				</div>
			</div>
			<button
				type="button"
				onClick={handleDismiss}
				className="btn-brutal btn-brutal--plain ms-auto flex-shrink-0"
				aria-label="Dismiss extension update notice"
			>
				<X size={20} />
			</button>
		</AlertBanner>
	);
}

export default ExtensionUpdateNotice;
