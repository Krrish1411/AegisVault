package io.aegisvault.app.storage;

import android.content.ContentValues;
import android.database.Cursor;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Capacitor Plugin bridging Web/TypeScript to native Android SQLite (aegisvault.db).
 */
@CapacitorPlugin(name = "AegisSqlite")
public class AegisSqlitePlugin extends Plugin {

    private static final String TAG = "AegisSqlitePlugin";
    private AegisSqliteHelper dbHelper;

    @Override
    public void load() {
        super.load();
        dbHelper = AegisSqliteHelper.getInstance(getContext());
        Log.i(TAG, "AegisSqlitePlugin initialized with native SQLite database");
    }

    @PluginMethod
    public void saveVaultContainer(PluginCall call) {
        String id = call.getString("id", "primary_vault");
        Integer formatVersion = call.getInt("formatVersion", 1);
        String containerJson = call.getString("containerJson");
        Long updatedAt = call.getLong("updatedAt", System.currentTimeMillis());

        if (containerJson == null || containerJson.isEmpty()) {
            call.reject("containerJson is required");
            return;
        }

        try {
            dbHelper.saveVaultContainer(id, formatVersion, containerJson, updatedAt);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to save vault container to SQLite", e);
            call.reject("Failed to save vault container: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void readVaultContainer(PluginCall call) {
        String id = call.getString("id", "primary_vault");
        try {
            String containerJson = dbHelper.readVaultContainer(id);
            JSObject ret = new JSObject();
            if (containerJson != null) {
                ret.put("exists", true);
                ret.put("containerJson", containerJson);
            } else {
                ret.put("exists", false);
                ret.put("containerJson", (String) null);
            }
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to read vault container from SQLite", e);
            call.reject("Failed to read vault container: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void vaultExists(PluginCall call) {
        String id = call.getString("id", "primary_vault");
        try {
            boolean exists = dbHelper.vaultExists(id);
            JSObject ret = new JSObject();
            ret.put("exists", exists);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to check vault existence: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void deleteVault(PluginCall call) {
        try {
            dbHelper.deleteAll();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to delete vault from SQLite: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void saveAttachment(PluginCall call) {
        String id = call.getString("id");
        String nonce = call.getString("nonce");
        String ciphertext = call.getString("ciphertext");
        Long sizeBytes = call.getLong("sizeBytes", 0L);
        String checksum = call.getString("checksumSha256");
        Long updatedAt = call.getLong("updatedAt", System.currentTimeMillis());

        if (id == null || nonce == null || ciphertext == null) {
            call.reject("id, nonce, and ciphertext are required");
            return;
        }

        try {
            dbHelper.saveAttachment(id, nonce, ciphertext, sizeBytes, checksum, updatedAt);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to save attachment: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void readAttachment(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }

        try (Cursor cursor = dbHelper.readAttachment(id)) {
            if (cursor != null && cursor.moveToFirst()) {
                JSObject ret = new JSObject();
                ret.put("id", cursor.getString(cursor.getColumnIndexOrThrow(AegisSqliteHelper.COL_ATT_ID)));
                ret.put("nonce", cursor.getString(cursor.getColumnIndexOrThrow(AegisSqliteHelper.COL_ATT_NONCE)));
                ret.put("ciphertext", cursor.getString(cursor.getColumnIndexOrThrow(AegisSqliteHelper.COL_ATT_CIPHERTEXT)));
                ret.put("sizeBytes", cursor.getLong(cursor.getColumnIndexOrThrow(AegisSqliteHelper.COL_ATT_SIZE)));
                ret.put("checksumSha256", cursor.getString(cursor.getColumnIndexOrThrow(AegisSqliteHelper.COL_ATT_CHECKSUM)));
                ret.put("updatedAt", cursor.getLong(cursor.getColumnIndexOrThrow(AegisSqliteHelper.COL_ATT_UPDATED_AT)));
                call.resolve(ret);
            } else {
                call.resolve(null);
            }
        } catch (Exception e) {
            call.reject("Failed to read attachment: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void deleteAttachment(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("id is required");
            return;
        }

        try {
            dbHelper.deleteAttachment(id);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to delete attachment: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void listAttachmentIds(PluginCall call) {
        try {
            List<String> ids = dbHelper.listAttachmentIds();
            JSArray array = new JSArray();
            for (String id : ids) {
                array.put(id);
            }
            JSObject ret = new JSObject();
            ret.put("ids", array);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to list attachment IDs: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void syncAutofillIndex(PluginCall call) {
        JSArray items = call.getArray("items");
        if (items == null) {
            call.resolve(new JSObject());
            return;
        }

        try {
            List<ContentValues> valuesList = new ArrayList<>();
            for (int i = 0; i < items.length(); i++) {
                JSONObject obj = items.getJSONObject(i);
                ContentValues cv = new ContentValues();
                cv.put(AegisSqliteHelper.COL_AUTO_ID, obj.optString("id"));
                cv.put(AegisSqliteHelper.COL_AUTO_DOMAIN, obj.optString("domain"));
                cv.put(AegisSqliteHelper.COL_AUTO_PACKAGE, obj.optString("packageId"));
                cv.put(AegisSqliteHelper.COL_AUTO_TITLE, obj.optString("title"));
                cv.put(AegisSqliteHelper.COL_AUTO_USERNAME, obj.optString("username"));
                cv.put(AegisSqliteHelper.COL_AUTO_ENCRYPTED_SECRET, obj.optString("encryptedSecret"));
                cv.put(AegisSqliteHelper.COL_AUTO_UPDATED_AT, obj.optLong("updatedAt", System.currentTimeMillis()));
                valuesList.add(cv);
            }
            dbHelper.clearAndSyncAutofillIndex(valuesList);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("syncedCount", valuesList.size());
            call.resolve(ret);
        } catch (JSONException e) {
            call.reject("Failed to parse autofill items: " + e.getMessage(), e);
        } catch (Exception e) {
            call.reject("Failed to sync autofill index: " + e.getMessage(), e);
        }
    }
}
