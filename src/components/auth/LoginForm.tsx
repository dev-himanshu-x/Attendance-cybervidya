import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Cookies from "js-cookie";
import { IdCard, Lock, LogIn } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getServerErrorReason } from "../../api/auth";
import { useAuthToken } from "../../hooks/useAuthToken";
import { useToast } from "../../hooks/useToast";
import { useLoginMutation } from "../../queries/useLoginMutation";
import { useVerifyOtpMutation } from "../../queries/useVerifyOtpMutation";
import {
	COOKIE_EXPIRY,
	getApiMode,
	PASSWORD_COOKIE_NAME,
	REMEMBER_ME_COOKIE_NAME,
	STUDENT_ID_COOKIE_NAME,
	USERNAME_COOKIE_NAME,
} from "../../types/constants";
import InstallExtensionPage from "../docs/InstallExtensionPage";
import Button from "../ui/Button";
import PasswordInput from "../ui/PasswordInput";

const credentialsSchema = z.object({
	username: z.string().min(1, "University roll number is required"),
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean().optional(),
});
type CredentialsForm = z.infer<typeof credentialsSchema>;

const otpSchema = z.object({
	otp: z.string().length(6, "Enter the 6-digit OTP"),
});
type OtpForm = z.infer<typeof otpSchema>;

function LoginForm() {
	const savedUsername = Cookies.get(USERNAME_COOKIE_NAME) || "";
	const rememberMeSaved = Cookies.get(REMEMBER_ME_COOKIE_NAME) === "true";
	const savedPassword = rememberMeSaved
		? Cookies.get(PASSWORD_COOKIE_NAME) || ""
		: "";

	const { setToken } = useAuthToken();
	const toast = useToast();

	const [step, setStep] = useState<"credentials" | "otp">("credentials");
	const [transactionId, setTransactionId] = useState<string>("");
	const apiMode = getApiMode();
	const [isExtensionError, setIsExtensionError] = useState<boolean>(false);
	const [showInstallPage, setShowInstallPage] = useState<boolean>(false);

	const submittedRef = useRef({
		username: "",
		password: "",
		rememberMe: false,
	});

	const loginMutation = useLoginMutation();
	const otpMutation = useVerifyOtpMutation();

	const credentialsForm = useForm<CredentialsForm>({
		resolver: zodResolver(credentialsSchema),
		defaultValues: {
			username: savedUsername,
			password: savedPassword,
			rememberMe: rememberMeSaved,
		},
	});

	const otpForm = useForm<OtpForm>({
		resolver: zodResolver(otpSchema),
		defaultValues: { otp: "" },
	});

	function handleAuthError(
		err: unknown,
		form: typeof credentialsForm | typeof otpForm,
		invalidMessage: string,
	) {
		const serverReason = getServerErrorReason(err);
		if (axios.isAxiosError(err) && err.response?.status === 400) {
			form.setError("root", { message: serverReason || invalidMessage });
		} else if (axios.isAxiosError(err) && err.response?.status === 403) {
			if (apiMode === "live") {
				form.setError("root", {
					message: "Please Update the Extension to the latest version 3.6!",
				});
				setIsExtensionError(true);
			} else {
				form.setError("root", {
					message:
						serverReason ||
						"Access forbidden. Please check your credentials or try again.",
				});
				setIsExtensionError(false);
			}
		} else {
			toast.error(
				"The server isn’t responding or your internet connection may be unavailable. Please try again.",
			);
		}
	}

	const onCredentialsSubmit = credentialsForm.handleSubmit(async (values) => {
		credentialsForm.clearErrors("root");
		setIsExtensionError(false);

		try {
			const data = await loginMutation.mutateAsync({
				username: values.username,
				password: values.password,
			});
			submittedRef.current = {
				username: values.username,
				password: values.password,
				rememberMe: values.rememberMe ?? false,
			};
			setTransactionId(data.transactionId);
			setStep("otp");
		} catch (err) {
			handleAuthError(err, credentialsForm, "Invalid Username or Password");
		}
	});

	const onOtpSubmit = otpForm.handleSubmit(async (values) => {
		otpForm.clearErrors("root");
		setIsExtensionError(false);

		let token = "";
		try {
			const data = await otpMutation.mutateAsync({
				otp: values.otp,
				transactionId,
			});
			token = data.token;
		} catch (err) {
			handleAuthError(err, otpForm, "Invalid or expired OTP");
			return;
		}

		const submitted = submittedRef.current;
		if (savedUsername !== submitted.username) {
			Cookies.remove(STUDENT_ID_COOKIE_NAME);
		}

		setToken(token, COOKIE_EXPIRY);
		Cookies.set(USERNAME_COOKIE_NAME, submitted.username, {
			expires: COOKIE_EXPIRY,
		});
		Cookies.set(REMEMBER_ME_COOKIE_NAME, submitted.rememberMe.toString(), {
			expires: COOKIE_EXPIRY,
		});

		if (submitted.rememberMe) {
			Cookies.set(PASSWORD_COOKIE_NAME, submitted.password, {
				expires: COOKIE_EXPIRY,
			});
		} else {
			Cookies.remove(PASSWORD_COOKIE_NAME);
		}
	});

	if (showInstallPage) {
		return <InstallExtensionPage onBack={() => setShowInstallPage(false)} />;
	}

	const isLoading =
		step === "credentials" ? loginMutation.isPending : otpMutation.isPending;

	return (
		<div className="d-flex flex-column my-5 align-items-center justify-content-center p-4">
			<div
				className="card-panel card-panel--sheen w-100 fade-in"
				style={{ maxWidth: "28rem" }}
			>
				<div className="auth-icon-badge mb-4">
					<LogIn size={32} />
				</div>
				{step === "credentials" ? (
					<form
						onSubmit={onCredentialsSubmit}
						className="d-flex flex-column gap-4"
					>
						<div>
							<label htmlFor="username" className="form-label-brutal">
								University Roll Number
							</label>
							<div className="form-field">
								<span className="form-field__icon">
									<IdCard size={18} />
								</span>
								<input
									id="username"
									type="text"
									placeholder="20240XXXXXXXXXX"
									className="form-control-brutal form-control-brutal--with-icon-start"
									{...credentialsForm.register("username")}
								/>
							</div>
							{credentialsForm.formState.errors.username && (
								<p className="form-error">
									{credentialsForm.formState.errors.username.message}
								</p>
							)}
						</div>
						<div>
							<label htmlFor="password" className="form-label-brutal">
								CyberVidya Password
							</label>
							<PasswordInput
								icon={<Lock size={18} />}
								{...credentialsForm.register("password")}
							/>
							{credentialsForm.formState.errors.password && (
								<p className="form-error">
									{credentialsForm.formState.errors.password.message}
								</p>
							)}
						</div>
						<div className="d-flex align-items-center justify-content-end">
							<input
								id="remember-me"
								type="checkbox"
								className="form-control-brutal"
								style={{ width: "1.25rem", height: "1.25rem", flex: "none" }}
								{...credentialsForm.register("rememberMe")}
							/>
							<label
								htmlFor="remember-me"
								className="ms-2 text-brutal fw-bold"
								style={{ fontSize: "0.875rem" }}
							>
								Remember me
							</label>
						</div>

						{credentialsForm.formState.errors.root && (
							<AuthErrorBox
								message={credentialsForm.formState.errors.root.message ?? ""}
								isExtensionError={isExtensionError}
								onViewGuide={() => setShowInstallPage(true)}
								variant="warning"
							/>
						)}

						<Button type="submit" variant="primary" disabled={isLoading}>
							{isLoading ? "Loading..." : "View Attendance"}
						</Button>
					</form>
				) : (
					<form onSubmit={onOtpSubmit} className="d-flex flex-column gap-4">
						<div className="text-center text-secondary">
							An OTP has been sent to your registered email address. Enter it
							below to continue.
						</div>
						<div>
							<label htmlFor="otp" className="form-label-brutal">
								One-Time Password (OTP)
							</label>
							<input
								id="otp"
								type="text"
								inputMode="numeric"
								autoComplete="one-time-code"
								maxLength={6}
								placeholder="XXXXXX"
								className="form-control-brutal"
								{...otpForm.register("otp")}
							/>
							{otpForm.formState.errors.otp && (
								<p className="form-error">
									{otpForm.formState.errors.otp.message}
								</p>
							)}
						</div>

						{otpForm.formState.errors.root && (
							<AuthErrorBox
								message={otpForm.formState.errors.root.message ?? ""}
								isExtensionError={isExtensionError}
								onViewGuide={() => setShowInstallPage(true)}
								variant="danger"
							/>
						)}

						<Button type="submit" variant="primary" disabled={isLoading}>
							{isLoading ? "Verifying..." : "Verify OTP"}
						</Button>
						<button
							type="button"
							onClick={() => {
								setStep("credentials");
								otpForm.clearErrors("root");
								setIsExtensionError(false);
							}}
							className="btn-brutal btn-brutal--plain w-100 text-center"
						>
							Back to login
						</button>
					</form>
				)}
			</div>
		</div>
	);
}

interface AuthErrorBoxProps {
	message: string;
	isExtensionError: boolean;
	onViewGuide: () => void;
	variant: "warning" | "danger";
}

function AuthErrorBox({
	message,
	isExtensionError,
	onViewGuide,
	variant,
}: AuthErrorBoxProps) {
	return (
		<div
			className={`position-relative alert-callout alert-callout--${variant} text-brutal`}
			style={{ fontSize: "0.875rem" }}
		>
			{isExtensionError && (
				<span
					className="badge-attendance badge-attendance--absent badge-attendance--sm position-absolute rounded-pill"
					style={{ top: "-0.75rem", right: "-0.75rem" }}
				>
					New
				</span>
			)}
			<p className="mb-0">{message}</p>
			{isExtensionError && (
				<button
					type="button"
					onClick={onViewGuide}
					className="btn-brutal btn-brutal--plain mt-2"
				>
					View extension installation guide →
				</button>
			)}
		</div>
	);
}

export default LoginForm;
