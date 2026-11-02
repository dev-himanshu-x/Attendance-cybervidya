import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";

export const MIN_TARGET = 60;
export const MAX_TARGET = 100;
const DEFAULT_TARGET = 75;

interface TargetContextValue {
	target: number;
	setTarget: (value: number) => void;
}

const TargetContext = createContext<TargetContextValue | undefined>(undefined);

export function TargetProvider({ children }: { children: ReactNode }) {
	const [target, setTargetState] = useState(DEFAULT_TARGET);
	const value = useMemo(
		() => ({
			target,
			setTarget: (next: number) =>
				setTargetState(Math.min(MAX_TARGET, Math.max(MIN_TARGET, next))),
		}),
		[target],
	);
	return (
		<TargetContext.Provider value={value}>{children}</TargetContext.Provider>
	);
}

export function useTarget(): TargetContextValue {
	const ctx = useContext(TargetContext);
	if (!ctx) throw new Error("useTarget must be used within a TargetProvider");
	return ctx;
}
