package io.aegisvault.app.storage;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;

/**
 * High-performance SQLite database helper for AegisVault.
 * Stores 100% encrypted ciphertext containers and index records.
 * Accessible natively by both the app and background AutofillService.
 */
public class AegisSqliteHelper extends SQLiteOpenHelper {

    private static final String TAG = "AegisSqliteHelper";
    public static final String DATABASE_NAME = "aegisvault.db";

    // Table: vault_metadata
    public static final String TABLE_VAULT = "vault_metadata";
    public static final String COL_VAULT_ID = "id";
    public static final String COL_FORMAT_VERSION = "format_version";
    public static final String COL_CONTAINER_JSON = "container_json";
    public static final String COL_VAULT_UPDATED_AT = "updated_at";

    // Table: encrypted_attachments
    public static final String TABLE_ATTACHMENTS = "encrypted_attachments";
    public static final String COL_ATT_ID = "id";
    public static final String COL_ATT_NONCE = "nonce";
    public static final String COL_ATT_CIPHERTEXT = "ciphertext";
    public static final String COL_ATT_SIZE = "size_bytes";
    public static final String COL_ATT_CHECKSUM = "checksum_sha256";
    public static final String COL_ATT_UPDATED_AT = "updated_at";

    // Table: autofill_index (for <5ms native autofill lookups)
    public static final String TABLE_AUTOFILL = "autofill_index";
    public static final String COL_AUTO_ID = "id";
    public static final String COL_AUTO_DOMAIN = "domain";
    public static final String COL_AUTO_PACKAGE = "package_id";
    public static final String COL_AUTO_TITLE = "title";
    public static final String COL_AUTO_USERNAME = "username";
    public static final String COL_AUTO_ENCRYPTED_SECRET = "encrypted_secret";
    public static final String COL_AUTO_UPDATED_AT = "updated_at";

    // Table: captured_credentials (captured by AutofillService on website form submission)
    public static final String TABLE_CAPTURED = "captured_credentials";
    public static final String COL_CAP_ID = "id";
    public static final String COL_CAP_DOMAIN = "domain";
    public static final String COL_CAP_PACKAGE = "package_id";
    public static final String COL_CAP_TITLE = "title";
    public static final String COL_CAP_USERNAME = "username";
    public static final String COL_CAP_PASSWORD = "password";
    public static final String COL_CAP_CREATED_AT = "created_at";

    private static final int DATABASE_VERSION = 2;
    private static AegisSqliteHelper sInstance;

    public static synchronized AegisSqliteHelper getInstance(Context context) {
        if (sInstance == null) {
            sInstance = new AegisSqliteHelper(context.getApplicationContext());
        }
        return sInstance;
    }

    public AegisSqliteHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        Log.i(TAG, "Creating AegisVault SQLite database tables...");

        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_VAULT + " (" +
                COL_VAULT_ID + " TEXT PRIMARY KEY, " +
                COL_FORMAT_VERSION + " INTEGER NOT NULL, " +
                COL_CONTAINER_JSON + " TEXT NOT NULL, " +
                COL_VAULT_UPDATED_AT + " INTEGER NOT NULL" +
                ");");

        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_ATTACHMENTS + " (" +
                COL_ATT_ID + " TEXT PRIMARY KEY, " +
                COL_ATT_NONCE + " TEXT NOT NULL, " +
                COL_ATT_CIPHERTEXT + " TEXT NOT NULL, " +
                COL_ATT_SIZE + " INTEGER NOT NULL, " +
                COL_ATT_CHECKSUM + " TEXT NOT NULL, " +
                COL_ATT_UPDATED_AT + " INTEGER NOT NULL" +
                ");");

        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_AUTOFILL + " (" +
                COL_AUTO_ID + " TEXT PRIMARY KEY, " +
                COL_AUTO_DOMAIN + " TEXT, " +
                COL_AUTO_PACKAGE + " TEXT, " +
                COL_AUTO_TITLE + " TEXT NOT NULL, " +
                COL_AUTO_USERNAME + " TEXT, " +
                COL_AUTO_ENCRYPTED_SECRET + " TEXT NOT NULL, " +
                COL_AUTO_UPDATED_AT + " INTEGER NOT NULL" +
                ");");

        db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_CAPTURED + " (" +
                COL_CAP_ID + " TEXT PRIMARY KEY, " +
                COL_CAP_DOMAIN + " TEXT, " +
                COL_CAP_PACKAGE + " TEXT, " +
                COL_CAP_TITLE + " TEXT NOT NULL, " +
                COL_CAP_USERNAME + " TEXT, " +
                COL_CAP_PASSWORD + " TEXT, " +
                COL_CAP_CREATED_AT + " INTEGER NOT NULL" +
                ");");

        db.execSQL("CREATE INDEX IF NOT EXISTS idx_autofill_domain ON " + TABLE_AUTOFILL + " (" + COL_AUTO_DOMAIN + ");");
        db.execSQL("CREATE INDEX IF NOT EXISTS idx_autofill_pkg ON " + TABLE_AUTOFILL + " (" + COL_AUTO_PACKAGE + ");");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        Log.i(TAG, "Upgrading database from " + oldVersion + " to " + newVersion);
        if (oldVersion < 2) {
            db.execSQL("CREATE TABLE IF NOT EXISTS " + TABLE_CAPTURED + " (" +
                    COL_CAP_ID + " TEXT PRIMARY KEY, " +
                    COL_CAP_DOMAIN + " TEXT, " +
                    COL_CAP_PACKAGE + " TEXT, " +
                    COL_CAP_TITLE + " TEXT NOT NULL, " +
                    COL_CAP_USERNAME + " TEXT, " +
                    COL_CAP_PASSWORD + " TEXT, " +
                    COL_CAP_CREATED_AT + " INTEGER NOT NULL" +
                    ");");
        }
    }

    // Vault Container Operations
    public void saveVaultContainer(String id, int formatVersion, String containerJson, long updatedAt) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put(COL_VAULT_ID, id);
        cv.put(COL_FORMAT_VERSION, formatVersion);
        cv.put(COL_CONTAINER_JSON, containerJson);
        cv.put(COL_VAULT_UPDATED_AT, updatedAt);
        db.insertWithOnConflict(TABLE_VAULT, null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }

    public String readVaultContainer(String id) {
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor cursor = db.query(TABLE_VAULT, new String[]{COL_CONTAINER_JSON},
                COL_VAULT_ID + " = ?", new String[]{id}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                return cursor.getString(0);
            }
        }
        return null;
    }

    public boolean vaultExists(String id) {
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor cursor = db.query(TABLE_VAULT, new String[]{COL_VAULT_ID},
                COL_VAULT_ID + " = ?", new String[]{id}, null, null, null)) {
            return cursor != null && cursor.moveToFirst();
        }
    }

    public void deleteAll() {
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            db.delete(TABLE_VAULT, null, null);
            db.delete(TABLE_ATTACHMENTS, null, null);
            db.delete(TABLE_AUTOFILL, null, null);
            db.delete(TABLE_CAPTURED, null, null);
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    // Attachment Operations
    public void saveAttachment(String id, String nonce, String ciphertext, long sizeBytes, String checksum, long updatedAt) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put(COL_ATT_ID, id);
        cv.put(COL_ATT_NONCE, nonce);
        cv.put(COL_ATT_CIPHERTEXT, ciphertext);
        cv.put(COL_ATT_SIZE, sizeBytes);
        cv.put(COL_ATT_CHECKSUM, checksum);
        cv.put(COL_ATT_UPDATED_AT, updatedAt);
        db.insertWithOnConflict(TABLE_ATTACHMENTS, null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }

    public Cursor readAttachment(String id) {
        SQLiteDatabase db = getReadableDatabase();
        return db.query(TABLE_ATTACHMENTS, null, COL_ATT_ID + " = ?", new String[]{id}, null, null, null);
    }

    public void deleteAttachment(String id) {
        SQLiteDatabase db = getWritableDatabase();
        db.delete(TABLE_ATTACHMENTS, COL_ATT_ID + " = ?", new String[]{id});
    }

    public List<String> listAttachmentIds() {
        List<String> result = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor cursor = db.query(TABLE_ATTACHMENTS, new String[]{COL_ATT_ID}, null, null, null, null, null)) {
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    result.add(cursor.getString(0));
                }
            }
        }
        return result;
    }

    // Autofill Index Operations
    public void clearAndSyncAutofillIndex(List<ContentValues> items) {
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            db.delete(TABLE_AUTOFILL, null, null);
            for (ContentValues cv : items) {
                db.insert(TABLE_AUTOFILL, null, cv);
            }
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    public Cursor queryAutofillForPackageOrDomain(String packageId, String domain) {
        SQLiteDatabase db = getReadableDatabase();
        if (domain != null && !domain.isEmpty() && packageId != null && !packageId.isEmpty()) {
            return db.query(TABLE_AUTOFILL, null,
                    COL_AUTO_PACKAGE + " = ? OR " + COL_AUTO_DOMAIN + " LIKE ?",
                    new String[]{packageId, "%" + domain + "%"}, null, null, null);
        } else if (packageId != null && !packageId.isEmpty()) {
            return db.query(TABLE_AUTOFILL, null,
                    COL_AUTO_PACKAGE + " = ?",
                    new String[]{packageId}, null, null, null);
        } else if (domain != null && !domain.isEmpty()) {
            return db.query(TABLE_AUTOFILL, null,
                    COL_AUTO_DOMAIN + " LIKE ?",
                    new String[]{"%" + domain + "%"}, null, null, null);
        }
        return null;
    }

    // Captured Credential Operations (Form Submission & Save Pop-Up)
    public void saveCapturedCredential(String domain, String packageId, String title, String username, String password) {
        if ((username == null || username.trim().isEmpty()) && (password == null || password.trim().isEmpty())) {
            return;
        }
        SQLiteDatabase db = getWritableDatabase();
        long now = System.currentTimeMillis();
        String id = "cap-" + now + "-" + (int)(Math.random() * 10000);

        // 1. Insert into captured_credentials table for in-app review
        ContentValues capCv = new ContentValues();
        capCv.put(COL_CAP_ID, id);
        capCv.put(COL_CAP_DOMAIN, domain != null ? domain : "");
        capCv.put(COL_CAP_PACKAGE, packageId != null ? packageId : "");
        capCv.put(COL_CAP_TITLE, title != null && !title.isEmpty() ? title : (domain != null && !domain.isEmpty() ? domain : "Captured Login"));
        capCv.put(COL_CAP_USERNAME, username != null ? username : "");
        capCv.put(COL_CAP_PASSWORD, password != null ? password : "");
        capCv.put(COL_CAP_CREATED_AT, now);
        db.insertWithOnConflict(TABLE_CAPTURED, null, capCv, SQLiteDatabase.CONFLICT_REPLACE);

        // 2. Also insert or update autofill_index so it is immediately autofillable in <5ms
        ContentValues autoCv = new ContentValues();
        autoCv.put(COL_AUTO_ID, id);
        autoCv.put(COL_AUTO_DOMAIN, domain != null ? domain : "");
        autoCv.put(COL_AUTO_PACKAGE, packageId != null ? packageId : "");
        autoCv.put(COL_AUTO_TITLE, title != null && !title.isEmpty() ? title : (domain != null && !domain.isEmpty() ? domain : "Captured Login"));
        autoCv.put(COL_AUTO_USERNAME, username != null ? username : "");
        autoCv.put(COL_AUTO_ENCRYPTED_SECRET, password != null ? password : "");
        autoCv.put(COL_AUTO_UPDATED_AT, now);
        db.insertWithOnConflict(TABLE_AUTOFILL, null, autoCv, SQLiteDatabase.CONFLICT_REPLACE);

        Log.i(TAG, "Saved captured credential for domain: " + domain + ", user: " + username);
    }

    public Cursor getCapturedCredentials() {
        SQLiteDatabase db = getReadableDatabase();
        return db.query(TABLE_CAPTURED, null, null, null, null, null, COL_CAP_CREATED_AT + " DESC");
    }

    public void deleteCapturedCredential(String id) {
        SQLiteDatabase db = getWritableDatabase();
        db.delete(TABLE_CAPTURED, COL_CAP_ID + " = ?", new String[]{id});
    }

    public void clearCapturedCredentials() {
        SQLiteDatabase db = getWritableDatabase();
        db.delete(TABLE_CAPTURED, null, null);
    }
}
