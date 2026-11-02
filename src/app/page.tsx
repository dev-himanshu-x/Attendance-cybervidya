"use client";

import dynamic from "next/dynamic";

// The app reads cookies and localStorage during its first render (auth
// token, theme, API mode), so it is rendered on the client only.
const AppRoot = dynamic(() => import("./app-root"), { ssr: false });

export default function Page() {
	return <AppRoot />;
}
