import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
	title: "KIET Attendance - CyberVidya",
	manifest: "/manifest.webmanifest",
	icons: {
		icon: "https://globaleducation.s3.ap-south-1.amazonaws.com/cyber-vidya/images/favicon.ico",
	},
};

// Runs before first paint so the saved theme never flashes the wrong colours.
const THEME_SCRIPT = `(() => {
	try {
		const stored = localStorage.getItem("theme");
		const theme =
			stored === "light" || stored === "dark"
				? stored
				: window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light";
		document.documentElement.dataset.theme = theme;
	} catch {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		// data-theme is set by the script above, before React hydrates.
		<html lang="en" suppressHydrationWarning>
			<body>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: static inline theme bootstrap */}
				<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
				{children}
			</body>
		</html>
	);
}
