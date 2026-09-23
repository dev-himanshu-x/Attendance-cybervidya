import Cookies from "js-cookie";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { AUTH_COOKIE_NAME } from "../types/constants";

interface AuthTokenContextValue {
	token: string | null;
	setToken: (value: string, expiresInDays?: number) => void;
	clearToken: () => void;
}

const AuthTokenContext = createContext<AuthTokenContextValue | undefined>(
	undefined,
);

export function AuthTokenProvider({ children }: { children: ReactNode }) {
	const [token, setTokenState] = useState<string | null>(
		() => Cookies.get(AUTH_COOKIE_NAME) ?? null,
	);

	const setToken = useCallback((value: string, expiresInDays?: number) => {
		Cookies.set(
			AUTH_COOKIE_NAME,
			value,
			expiresInDays ? { expires: expiresInDays } : undefined,
		);
		setTokenState(value);
	}, []);

	const clearToken = useCallback(() => {
		Cookies.remove(AUTH_COOKIE_NAME);
		setTokenState(null);
	}, []);

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
