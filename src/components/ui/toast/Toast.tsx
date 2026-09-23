import clsx from "clsx";
import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import type { ToastItem } from "./ToastProvider";

interface ToastProps {
	toast: ToastItem;
	onDismiss: (id: string) => void;
}

const ICONS = {
	error: AlertTriangle,
	success: CheckCircle,
	info: Info,
};

export default function Toast({ toast, onDismiss }: ToastProps) {
	const Icon = ICONS[toast.type];

	return (
		<div
			className={clsx("toast-brutal", `toast-brutal--${toast.type}`)}
			role="alert"
		>
			<Icon className="toast-brutal__icon" size={18} />
			<div className="toast-brutal__message">
				<p>{toast.message}</p>
				{toast.action && (
					<button
						type="button"
						className="btn-brutal btn-brutal--plain"
						onClick={toast.action.onClick}
					>
						{toast.action.label}
					</button>
				)}
			</div>
			<button
				type="button"
				className="toast-brutal__close"
				onClick={() => onDismiss(toast.id)}
				aria-label="Dismiss notification"
			>
				<X size={16} />
			</button>
		</div>
	);
}
