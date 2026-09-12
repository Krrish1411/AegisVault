# AegisVault Production Code Protection & Optimization Rules
# Repackage all internal classes to prevent decompilation reverse-engineering
-repackageclasses 'io.aegisvault.obf'
-allowaccessmodification

# Optimization settings
-optimizationpasses 5
-dontpreverify

# Capacitor & WebView Javascript Interfaces (must be preserved for bridge communication)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keep public class com.getcapacitor.** { *; }
-keep public class io.aegisvault.app.** { *; }

# Preserve type annotations and signatures
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Strip all Android log calls in release builds to protect user credential privacy
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
}
