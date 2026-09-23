import { createPortal } from "react-dom";
import Toast from "./Toast";
import type { ToastItem } from "./ToastProvider";

interface ToastContainerProps {
	toasts: ToastItem[];
	onDismiss: (id: string) => void;
}

export default function ToastContainer({
	toasts,
	onDismiss,
}: ToastContainerProps) {
	if (toasts.length === 0) return null;

	return createPortal(
		<div className="toast-container">
			{toasts.map((toast) => (
				<Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
			))}
		</div>,
		document.body,
	);
}
