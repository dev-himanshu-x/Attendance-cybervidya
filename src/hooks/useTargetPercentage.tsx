import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import {
	DEFAULT_TARGET_PERCENTAGE,
	MAX_TARGET_PERCENTAGE,
	MIN_TARGET_PERCENTAGE,
} from "../types/constants";

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
	const [targetPercentage, setTargetPercentageState] = useState<number>(
		DEFAULT_TARGET_PERCENTAGE,
	);

	const setTargetPercentage = useCallback((value: number) => {
		const clamped = Math.min(
			MAX_TARGET_PERCENTAGE,
			Math.max(MIN_TARGET_PERCENTAGE, value),
		);
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
