const LIVE_URL = "https://kiet.cybervidya.net";

// The browser calls CyberVidya directly. Its firewall rejects cross-origin
// browser calls unless the "Attendance Bridge" extension strips the Origin and
// Referer headers, so the extension is required (and relays are not an option:
// the firewall also rejects anything that is not a real browser).
export function getApiMode(): "live" {
	return "live";
}

export function getBaseUrl(): string {
	return LIVE_URL;
}

export const AUTH_COOKIE_NAME = "auth_token";
export const USERNAME_COOKIE_NAME = "username";
export const REMEMBER_ME_COOKIE_NAME = "remember_me";
export const PASSWORD_COOKIE_NAME = "password";
export const COOKIE_EXPIRY = 7; // Days
export const STUDENT_ID_COOKIE_NAME = "studentId";
export const DEFAULT_TARGET_PERCENTAGE = 75;
export const MIN_TARGET_PERCENTAGE = 60;
export const MAX_TARGET_PERCENTAGE = 100;
export const REQUIRED_EXTENSION_VERSION = "4.6";

// Served by the site itself (built by scripts/pack-extension.mjs), so the
// download always matches the extension this version of the site expects.
export const EXTENSION_DOWNLOAD_CHROME =
	"/downloads/attendance-bridge-chrome.zip";
export const EXTENSION_DOWNLOAD_FIREFOX =
	"/downloads/attendance-bridge-firefox.xpi";
