import { registerPlugin, Capacitor } from '@capacitor/core';

export interface BiometricAvailabilityResult {
  available: boolean;
  reason: string;
  biometryType: 'biometric' | 'fingerprint' | 'face' | 'none';
}

export interface BiometricPromptResult {
  success: boolean;
  error?: string;
  errorCode?: number;
}

export interface AutofillStatusResult {
  supported: boolean;
  enabled: boolean;
}

export interface AegisBiometricPluginInterface {
  checkBiometricAvailability(): Promise<BiometricAvailabilityResult>;
  promptBiometric(options?: {
    title?: string;
    subtitle?: string;
    negativeButtonText?: string;
  }): Promise<BiometricPromptResult>;
  checkAutofillStatus(): Promise<AutofillStatusResult>;
  openAutofillSettings(): Promise<{ success: boolean }>;
}

export const AegisBiometric = registerPlugin<AegisBiometricPluginInterface>('AegisBiometric', {
  web: {
    async checkBiometricAvailability() {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          return {
            available,
            reason: available ? 'AVAILABLE' : 'NO_HARDWARE',
            biometryType: 'biometric',
          };
        } catch {
          return { available: false, reason: 'NOT_SUPPORTED', biometryType: 'none' };
        }
      }
      return { available: false, reason: 'NO_HARDWARE', biometryType: 'none' };
    },
    async promptBiometric() {
      return { success: true };
    },
    async checkAutofillStatus() {
      return { supported: false, enabled: false };
    },
    async openAutofillSettings() {
      return { success: false };
    },
  },
});

export const aegisBiometricClient = {
  checkBiometricAvailability: async (): Promise<BiometricAvailabilityResult> => {
    return await AegisBiometric.checkBiometricAvailability();
  },
  promptBiometric: async (options?: {
    title?: string;
    subtitle?: string;
    negativeButtonText?: string;
  }): Promise<BiometricPromptResult> => {
    return await AegisBiometric.promptBiometric(options);
  },
  checkAutofillStatus: async (): Promise<AutofillStatusResult> => {
    return await AegisBiometric.checkAutofillStatus();
  },
  openAutofillSettings: async (): Promise<{ success: boolean }> => {
    return await AegisBiometric.openAutofillSettings();
  },
};

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};
