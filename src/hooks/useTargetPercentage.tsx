import Cookies from "js-cookie";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import {
	COOKIE_EXPIRY,
	DEFAULT_TARGET_PERCENTAGE,
	MAX_TARGET_PERCENTAGE,
	MIN_TARGET_PERCENTAGE,
	TARGET_PERCENTAGE_COOKIE_NAME,
} from "../types/constants";

function readStoredTarget(): number {
	const cookieVal = Number(Cookies.get(TARGET_PERCENTAGE_COOKIE_NAME));
	if (
		Number.isFinite(cookieVal) &&
		cookieVal >= MIN_TARGET_PERCENTAGE &&
		cookieVal <= MAX_TARGET_PERCENTAGE
	) {
		return cookieVal;
	}
	return DEFAULT_TARGET_PERCENTAGE;
}

interface TargetPercentageContextValue {
	targetPercentage: number;
	setTargetPercentage: (value: number) => void;
}

const TargetPercentageContext = createContext<
	TargetPercentageContextValue | undefined
>(undefined);

export function TargetPercentageProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [targetPercentage, setTargetPercentageState] =
		useState<number>(readStoredTarget);

	const setTargetPercentage = useCallback((value: number) => {
		const clamped = Math.min(
			MAX_TARGET_PERCENTAGE,
			Math.max(MIN_TARGET_PERCENTAGE, value),
		);
		Cookies.set(TARGET_PERCENTAGE_COOKIE_NAME, String(clamped), {
			expires: COOKIE_EXPIRY * 52,
		});
		setTargetPercentageState(clamped);
	}, []);

	const value = useMemo(
		() => ({ targetPercentage, setTargetPercentage }),
		[targetPercentage, setTargetPercentage],
	);

	return (
		<TargetPercentageContext.Provider value={value}>
			{children}
		</TargetPercentageContext.Provider>
	);
}

export function useTargetPercentage(): TargetPercentageContextValue {
	const ctx = useContext(TargetPercentageContext);
	if (!ctx) {
		throw new Error(
			"useTargetPercentage must be used within a TargetPercentageProvider",
		);
	}
	return ctx;
}
