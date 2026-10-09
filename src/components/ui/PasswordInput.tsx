import { Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useState } from "react";

interface PasswordInputProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	icon?: ReactNode;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
	({ id = "password", className, icon, ...rest }, ref) => {
		const [isPasswordVisible, togglePasswordVisibility] =
			useState<boolean>(false);

		return (
			<div className="form-field flex items-center">
				{icon && <span className="form-field__icon">{icon}</span>}
				<input
					id={id}
					type={isPasswordVisible ? "text" : "password"}
					ref={ref}
					className={`form-control-brutal form-control-brutal--with-icon ${icon ? "form-control-brutal--with-icon-start" : ""} ${className ?? ""}`}
					{...rest}
				/>
				<button
					type="button"
					onClick={() => togglePasswordVisibility(!isPasswordVisible)}
					className="btn-brutal btn-brutal--plain absolute top-1/2 end-0 -translate-y-1/2 me-4"
					aria-label={isPasswordVisible ? "Hide password" : "Show password"}
				>
					{isPasswordVisible ? <Eye size={18} /> : <EyeOff size={18} />}
				</button>
			</div>
		);
	},
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
