import clsx from "clsx";
import type { ReactNode } from "react";
import { useEffect } from "react";

interface ModalProps {
	onClose: () => void;
	children: ReactNode;
	variant?: "brutal" | "soft";
	className?: string;
}

export default function Modal({
	onClose,
	children,
	variant = "brutal",
	className,
}: ModalProps) {
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "auto";
		};
	}, []);

	return (
		<div className="modal-overlay">
			<button
				type="button"
				className="modal-overlay__backdrop"
				onClick={onClose}
				aria-label="Close modal"
				tabIndex={-1}
			/>
			<div
				className={clsx(
					"modal-panel",
					variant === "soft" && "modal-panel--soft",
					className,
				)}
			>
				{children}
			</div>
		</div>
	);
}
