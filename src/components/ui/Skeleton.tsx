import clsx from "clsx";
import type { HTMLAttributes } from "react";

export default function Skeleton({
	className,
	...rest
}: HTMLAttributes<HTMLDivElement>) {
	return <div className={clsx("skeleton", className)} {...rest} />;
}
