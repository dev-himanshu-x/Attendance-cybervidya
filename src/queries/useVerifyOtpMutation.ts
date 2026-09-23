import { useMutation } from "@tanstack/react-query";
import { verifyOtp } from "../api/auth";

export function useVerifyOtpMutation() {
	return useMutation({
		mutationFn: ({
			otp,
			transactionId,
		}: {
			otp: string;
			transactionId: string;
		}) => verifyOtp(otp, transactionId),
	});
}
