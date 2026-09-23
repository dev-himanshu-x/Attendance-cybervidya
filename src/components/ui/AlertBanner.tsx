import clsx from "clsx";
import type { ReactNode } from "react";

interface AlertBannerProps {
	variant: "info" | "warning";
	children: ReactNode;
	className?: string;
}

export default function AlertBanner({
	variant,
	children,
	className,
}: AlertBannerProps) {
	return (
		<div
			className={clsx("alert-banner", `alert-banner--${variant}`, className)}
		>
			<div className="alert-banner__inner">{children}</div>
		</div>
	);
}
