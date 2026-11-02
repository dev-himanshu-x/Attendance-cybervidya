import { type ComponentRef, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import {
	attachBridge,
	bridgeFailed,
	bridgeLoading,
	bridgeReady,
	handleBridgeMessage,
	resetBridge,
} from "@/api/bridge";
import { BASE_URL } from "@/api/http";

// Give CyberVidya's single-page app a moment to finish any redirect after it
// loads, so a request isn't injected into a page that's about to be replaced.
const SETTLE_MS = 1500;

// Hidden browser view showing CyberVidya's own page. API calls run inside it
// (see api/bridge.ts). Mounted only while signed in.
export default function DataBridge() {
	const webViewRef = useRef<ComponentRef<typeof WebView>>(null);
	const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		attachBridge((js) => webViewRef.current?.injectJavaScript(js));
		return () => {
			if (settleTimer.current) clearTimeout(settleTimer.current);
			resetBridge();
		};
	}, []);

	return (
		<View style={styles.hidden} pointerEvents="none" accessible={false}>
			<WebView
				ref={webViewRef}
				source={{ uri: BASE_URL }}
				// Fresh, non-persistent session: nothing is left on the phone.
				incognito
				onLoadStart={() => {
					if (settleTimer.current) clearTimeout(settleTimer.current);
					bridgeLoading();
				}}
				onLoad={() => {
					if (settleTimer.current) clearTimeout(settleTimer.current);
					settleTimer.current = setTimeout(bridgeReady, SETTLE_MS);
				}}
				onHttpError={(e) => bridgeFailed(e.nativeEvent.statusCode)}
				onError={() => bridgeFailed(0)}
				onMessage={(e) =>
					handleBridgeMessage(e.nativeEvent.data, e.nativeEvent.url)
				}
				// Stay on CyberVidya's site.
				onShouldStartLoadWithRequest={(request) =>
					request.url.startsWith(BASE_URL) || request.url === "about:blank"
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	hidden: {
		position: "absolute",
		width: 1,
		height: 1,
		opacity: 0,
		bottom: 0,
		left: 0,
	},
});
