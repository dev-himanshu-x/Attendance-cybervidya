import clsx from "clsx";
import type { HTMLAttributes } from "react";

type BadgeVariant =
	| "present"
	| "absent"
	| "adjusted"
	| "neutral"
	| "tinted"
	| "highlight";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant: BadgeVariant;
	size?: "sm" | "md";
}

export default function Badge({
	variant,
	size = "md",
	className,
	...rest
}: BadgeProps) {
	return (
		<span
			className={clsx(
				"badge-attendance",
				`badge-attendance--${variant}`,
				size === "sm" && "badge-attendance--sm",
				className,
			)}
			{...rest}
		/>
	);
}
