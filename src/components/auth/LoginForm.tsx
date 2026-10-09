import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Cookies from "js-cookie";
import { ArrowRight, ShieldCheck } from "lucide-react";
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

const SOURCE_CODE_URL =
	"https://github.com/dev-himanshu-x/Attendance-cybervidya";

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
		<div className="flex flex-col my-12 items-center justify-center p-6">
			<div className="auth-card w-full fade-in" style={{ maxWidth: "28rem" }}>
				<div className="auth-card__body">
					<div className="auth-logo mb-6">
						Cyber<span className="auth-logo__accent">Vidya</span>
					</div>
					<div className="text-center mb-6">
						<h1 className="text-xl font-bold text-brutal mb-1">
							{step === "credentials" ? "Welcome back!" : "Verify it's you"}
						</h1>
						<p className="text-sm text-[var(--clay-muted)] mb-0">
							{step === "credentials"
								? "Sign in to view your attendance"
								: "Enter the OTP sent to your registered email"}
						</p>
					</div>
					{step === "credentials" ? (
						<form
							onSubmit={onCredentialsSubmit}
							className="flex flex-col gap-5"
						>
							<div>
								<label htmlFor="username" className="form-label-brutal">
									University roll number
								</label>
								<input
									id="username"
									type="text"
									placeholder="20240XXXXXXXXXX"
									className="form-control-brutal"
									{...credentialsForm.register("username")}
								/>
								{credentialsForm.formState.errors.username && (
									<p className="form-error">
										{credentialsForm.formState.errors.username.message}
									</p>
								)}
							</div>
							<div>
								<label htmlFor="password" className="form-label-brutal">
									Password
								</label>
								<PasswordInput {...credentialsForm.register("password")} />
								{credentialsForm.formState.errors.password && (
									<p className="form-error">
										{credentialsForm.formState.errors.password.message}
									</p>
								)}
							</div>
							<div className="flex items-center gap-2">
								<input
									id="remember-me"
									type="checkbox"
									className="auth-checkbox"
									{...credentialsForm.register("rememberMe")}
								/>
								<label
									htmlFor="remember-me"
									className="text-brutal font-semibold"
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
								{isLoading ? "Loading..." : "Continue"}
								{!isLoading && <ArrowRight size={16} />}
							</Button>
						</form>
					) : (
						<form onSubmit={onOtpSubmit} className="flex flex-col gap-5">
							<div>
								<label htmlFor="otp" className="form-label-brutal">
									One-time password (OTP)
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
								{!isLoading && <ArrowRight size={16} />}
							</Button>
							<button
								type="button"
								onClick={() => {
									setStep("credentials");
									otpForm.clearErrors("root");
									setIsExtensionError(false);
								}}
								className="btn-brutal btn-brutal--plain w-full text-center"
							>
								Back to login
							</button>
						</form>
					)}
				</div>

				<div className="auth-card__footer">
					Your data stays in your browser.{" "}
					<a href={SOURCE_CODE_URL} target="_blank" rel="noopener noreferrer">
						View source
					</a>
				</div>
				<div className="auth-card__footer auth-card__footer--notice">
					<ShieldCheck size={14} />
					Not affiliated with KIET or CyberVidya
				</div>
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
			className={`relative alert-callout alert-callout--${variant} text-brutal`}
			style={{ fontSize: "0.875rem" }}
		>
			{isExtensionError && (
				<span
					className="badge-attendance badge-attendance--absent badge-attendance--sm absolute rounded-full"
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
