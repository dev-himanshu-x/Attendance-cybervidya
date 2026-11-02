import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

// Only the session token is stored (in the OS keychain/keystore). The password
// is never saved on the device.
const TOKEN_KEY = "auth_token";

function getJwtExpiryMs(token: string): number | null {
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		const normalised = payload.replace(/-/g, "+").replace(/_/g, "/");
		const exp = JSON.parse(atob(normalised)).exp;
		return typeof exp === "number" ? exp * 1000 : null;
	} catch {
		return null;
	}
}

// setTimeout overflows (fires immediately) beyond ~24.8 days.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

type AuthState =
	| { status: "loading" }
	| { status: "signedOut" }
	| { status: "signedIn"; token: string };

interface AuthContextValue {
	state: AuthState;
	signIn: (token: string) => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	const [state, setState] = useState<AuthState>({ status: "loading" });

	const signOut = useCallback(async () => {
		setState({ status: "signedOut" });
		queryClient.clear();
		try {
			await SecureStore.deleteItemAsync(TOKEN_KEY);
		} catch {
			// Nothing stored, or the keychain is unavailable.
		}
	}, [queryClient]);

	const signIn = useCallback(async (token: string) => {
		try {
			await SecureStore.setItemAsync(TOKEN_KEY, token);
		} catch {
			// Keep the session in memory even if it can't be persisted.
		}
		setState({ status: "signedIn", token });
	}, []);

	useEffect(() => {
		(async () => {
			try {
				const stored = await SecureStore.getItemAsync(TOKEN_KEY);
				const expiry = stored ? getJwtExpiryMs(stored) : null;
				if (stored && (expiry === null || expiry > Date.now())) {
					setState({ status: "signedIn", token: stored });
					return;
				}
			} catch {
				// Fall through to signed out.
			}
			setState({ status: "signedOut" });
		})();
	}, []);

	// Sign out automatically the moment the token expires.
	const token = state.status === "signedIn" ? state.token : null;
	useEffect(() => {
		if (!token) return;
		const expiry = getJwtExpiryMs(token);
		if (expiry === null) return;
		const timer = setTimeout(
			signOut,
			Math.min(Math.max(expiry - Date.now(), 0), MAX_TIMEOUT_MS),
		);
		return () => clearTimeout(timer);
	}, [token, signOut]);

	const value = useMemo(
		() => ({ state, signIn, signOut }),
		[state, signIn, signOut],
	);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
	return ctx;
}

// For screens that only render when signed in.
export function useToken(): string {
	const { state } = useAuth();
	if (state.status !== "signedIn") {
		throw new Error("useToken called while signed out");
	}
	return state.token;
}
