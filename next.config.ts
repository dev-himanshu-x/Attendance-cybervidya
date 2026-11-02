import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	// Hide the dev-only "N" badge; it sits on top of the extension popup.
	devIndicators: false,
};

export default nextConfig;
