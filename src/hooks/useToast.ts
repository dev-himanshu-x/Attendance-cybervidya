import { useMemo } from "react";
import type { ToastAction } from "../components/ui/toast/ToastProvider";
import { useToastContext } from "../components/ui/toast/ToastProvider";

export function useToast() {
	const { addToast, removeToast } = useToastContext();

	return useMemo(
		() => ({
			error: (message: string, action?: ToastAction) =>
				addToast("error", message, action),
			success: (message: string, action?: ToastAction) =>
				addToast("success", message, action),
			info: (message: string, action?: ToastAction) =>
				addToast("info", message, action),
			dismiss: removeToast,
		}),
		[addToast, removeToast],
	);
}
