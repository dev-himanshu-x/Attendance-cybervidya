import clsx from "clsx";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	fadeIn?: boolean;
}

export default function Card({ className, fadeIn = true, ...rest }: CardProps) {
	return (
		<div
			className={clsx("card-panel", fadeIn && "fade-in", className)}
			{...rest}
		/>
	);
}
