import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "outline" | "tinted" | "plain";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	active?: boolean;
	icon?: ReactNode;
	hideTextOnMobile?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			variant = "outline",
			active,
			icon,
			hideTextOnMobile,
			className,
			children,
			type = "button",
			...rest
		},
		ref,
	) => {
		return (
			<button
				ref={ref}
				type={type}
				className={clsx(
					"btn-brutal",
					`btn-brutal--${variant}`,
					active && "btn-brutal--outline-active",
					className,
				)}
				{...rest}
			>
				{icon}
				{children != null &&
					(hideTextOnMobile ? (
						<span className="btn-brutal__text">{children}</span>
					) : (
						children
					))}
			</button>
		);
	},
);

Button.displayName = "Button";

export default Button;
