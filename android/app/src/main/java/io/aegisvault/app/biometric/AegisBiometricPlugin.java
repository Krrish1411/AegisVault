package io.aegisvault.app.biometric;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.view.autofill.AutofillManager;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

/**
 * Pure Biometric & System Integration Plugin for AegisVault.
 * Exclusively uses strong hardware biometrics (Fingerprint / Face Unlock).
 * No device PIN fallback.
 */
@CapacitorPlugin(name = "AegisBiometric")
public class AegisBiometricPlugin extends Plugin {

    private static final String TAG = "AegisBiometricPlugin";

    @PluginMethod
    public void checkBiometricAvailability(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            BiometricManager biometricManager = BiometricManager.from(getContext());
            int canAuth = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);

            boolean available = (canAuth == BiometricManager.BIOMETRIC_SUCCESS);
            String reason = "BIOMETRIC_SUCCESS";

            switch (canAuth) {
                case BiometricManager.BIOMETRIC_SUCCESS:
                    reason = "AVAILABLE";
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                    reason = "NO_HARDWARE";
                    break;
                case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                    reason = "HARDWARE_UNAVAILABLE";
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                    reason = "NOT_ENROLLED";
                    break;
                case BiometricManager.BIOMETRIC_STATUS_UNKNOWN:
                default:
                    reason = "UNKNOWN";
                    break;
            }

            ret.put("available", available);
            ret.put("reason", reason);
            ret.put("biometryType", "biometric");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error checking biometric availability", e);
            ret.put("available", false);
            ret.put("reason", e.getMessage());
            ret.put("biometryType", "none");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void promptBiometric(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (!(getActivity() instanceof FragmentActivity)) {
                    call.reject("Activity must be a FragmentActivity to display BiometricPrompt");
                    return;
                }

                FragmentActivity activity = (FragmentActivity) getActivity();
                Executor executor = ContextCompat.getMainExecutor(activity);

                String title = call.getString("title", "AegisVault Biometric Unlock");
                String subtitle = call.getString("subtitle", "Verify your fingerprint or face to proceed");
                String negativeButtonText = call.getString("negativeButtonText", "Use Master Password");

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle)
                        .setNegativeButtonText(negativeButtonText)
                        .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                        .build();

                BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor,
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                                super.onAuthenticationSucceeded(result);
                                Log.i(TAG, "Biometric authentication succeeded");
                                JSObject ret = new JSObject();
                                ret.put("success", true);
                                call.resolve(ret);
                            }

                            @Override
                            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                                super.onAuthenticationError(errorCode, errString);
                                Log.w(TAG, "Biometric error: " + errorCode + " - " + errString);
                                JSObject ret = new JSObject();
                                ret.put("success", false);
                                ret.put("error", errString.toString());
                                ret.put("errorCode", errorCode);
                                call.resolve(ret);
                            }

                            @Override
                            public void onAuthenticationFailed() {
                                super.onAuthenticationFailed();
                                Log.d(TAG, "Biometric attempt rejected (wrong finger/face)");
                            }
                        });

                biometricPrompt.authenticate(promptInfo);
            } catch (Exception e) {
                Log.e(TAG, "Exception during promptBiometric", e);
                call.reject("Biometric prompt error: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void checkAutofillStatus(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                AutofillManager afm = getContext().getSystemService(AutofillManager.class);
                boolean supported = afm != null && afm.isAutofillSupported();
                boolean enabled = afm != null && afm.hasEnabledAutofillServices();
                ret.put("supported", supported);
                ret.put("enabled", enabled);
            } catch (Exception e) {
                ret.put("supported", false);
                ret.put("enabled", false);
            }
        } else {
            ret.put("supported", false);
            ret.put("enabled", false);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openAutofillSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                Log.w(TAG, "Could not launch ACTION_REQUEST_SET_AUTOFILL_SERVICE directly, trying general settings", e);
                try {
                    Intent generalIntent = new Intent(Settings.ACTION_SETTINGS);
                    generalIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(generalIntent);
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    call.resolve(ret);
                } catch (Exception ex) {
                    call.reject("Failed to open Android settings: " + ex.getMessage());
                }
            }
        } else {
            call.reject("Android Autofill is not supported on this Android version (< API 26)");
        }
    }
}
