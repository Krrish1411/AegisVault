package io.aegisvault.app;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import io.aegisvault.app.biometric.AegisBiometricPlugin;
import io.aegisvault.app.storage.AegisSqlitePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AegisSqlitePlugin.class);
        registerPlugin(AegisBiometricPlugin.class);
        super.onCreate(savedInstanceState);

        // FLAG_SECURE: Prevents screenshots, screen recording, and blanks preview in app switcher
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
    }

    @Override
    public void onStop() {
        super.onStop();
        // System lock: When the app is minimized, screen locks, or user navigates away,
        // trigger the webview security zeroing event
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(() -> {
                bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('aegis_system_lock'));",
                    null
                );
            });
        }
    }
}
