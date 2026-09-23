import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import ToastContainer from "./ToastContainer";

export type ToastType = "error" | "success" | "info";

export interface ToastAction {
	label: string;
	onClick: () => void;
}

export interface ToastItem {
	id: string;
	type: ToastType;
	message: string;
	action?: ToastAction;
}

interface ToastContextValue {
	toasts: ToastItem[];
	addToast: (type: ToastType, message: string, action?: ToastAction) => string;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
	}, []);

	const addToast = useCallback(
		(type: ToastType, message: string, action?: ToastAction) => {
			const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
			setToasts((prev) => [...prev, { id, type, message, action }]);
			const timer = setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
			timers.current.set(id, timer);
			return id;
		},
		[removeToast],
	);

	const value = useMemo(
		() => ({ toasts, addToast, removeToast }),
		[toasts, addToast, removeToast],
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer toasts={toasts} onDismiss={removeToast} />
		</ToastContext.Provider>
	);
}

export function useToastContext(): ToastContextValue {
	const ctx = useContext(ToastContext);
	if (!ctx)
		throw new Error("useToastContext must be used within a ToastProvider");
	return ctx;
}
