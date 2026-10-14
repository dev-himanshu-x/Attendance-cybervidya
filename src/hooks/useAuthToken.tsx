import Cookies from "js-cookie";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { AUTH_COOKIE_NAME } from "../types/constants";

// Returns the JWT `exp` claim in ms since epoch, or null if undecodable.
function getJwtExpiryMs(token: string): number | null {
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
		const exp = JSON.parse(json).exp;
		return typeof exp === "number" ? exp * 1000 : null;
	} catch {
		return null;
	}
}

// setTimeout overflows (fires immediately) beyond ~24.8 days.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

interface AuthTokenContextValue {
	token: string | null;
	setToken: (value: string, expiresInDays?: number) => void;
	clearToken: () => void;
}

const AuthTokenContext = createContext<AuthTokenContextValue | undefined>(
	undefined,
);

export function AuthTokenProvider({ children }: { children: ReactNode }) {
	const [token, setTokenState] = useState<string | null>(() => {
		const stored = Cookies.get(AUTH_COOKIE_NAME);
		if (!stored) return null;
		const expiry = getJwtExpiryMs(stored);
		if (expiry !== null && expiry <= Date.now()) {
			Cookies.remove(AUTH_COOKIE_NAME);
			return null;
		}
		return stored;
	});

	// Cookie lifetime follows the JWT's own expiry; the day count is only a
	// fallback for tokens without a readable `exp`.
	const setToken = useCallback((value: string, expiresInDays?: number) => {
		const expiry = getJwtExpiryMs(value);
		const expires = expiry !== null ? new Date(expiry) : expiresInDays;
		Cookies.set(AUTH_COOKIE_NAME, value, expires ? { expires } : undefined);
		setTokenState(value);
	}, []);

	const clearToken = useCallback(() => {
		Cookies.remove(AUTH_COOKIE_NAME);
		setTokenState(null);
	}, []);

	// Log out automatically the moment the JWT expires.
	useEffect(() => {
		if (!token) return;
		const expiry = getJwtExpiryMs(token);
		if (expiry === null) return;
		const timer = setTimeout(
			clearToken,
			Math.min(Math.max(expiry - Date.now(), 0), MAX_TIMEOUT_MS),
		);
		return () => clearTimeout(timer);
	}, [token, clearToken]);

	const value = useMemo(
		() => ({ token, setToken, clearToken }),
		[token, setToken, clearToken],
	);

	return (
		<AuthTokenContext.Provider value={value}>
			{children}
		</AuthTokenContext.Provider>
	);
}

export function useAuthToken(): AuthTokenContextValue {
	const ctx = useContext(AuthTokenContext);
	if (!ctx)
		throw new Error("useAuthToken must be used within an AuthTokenProvider");
	return ctx;
}
