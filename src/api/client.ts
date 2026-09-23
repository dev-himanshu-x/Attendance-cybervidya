export { getApiMode, getBaseUrl, setApiMode } from "../types/constants";

export function authHeaders(token: string): Record<string, string> {
	return { Authorization: `GlobalEducation ${token}` };
}
