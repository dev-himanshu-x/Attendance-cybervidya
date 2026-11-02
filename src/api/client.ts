import axios from "axios";
import { extensionAdapter } from "./extensionBridge";

// Every API call is made by the browser extension (see extensionBridge.ts).
axios.defaults.adapter = extensionAdapter;

export { getApiMode, getBaseUrl } from "../types/constants";

export function authHeaders(token: string): Record<string, string> {
	return { Authorization: `GlobalEducation ${token}` };
}
