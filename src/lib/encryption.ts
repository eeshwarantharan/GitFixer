import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment variable.
 * The key should be a 64-character hex string (32 bytes).
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        throw new Error("ENCRYPTION_KEY environment variable is not set");
    }

    if (key.length !== 64) {
        throw new Error(
            "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
        );
    }

    return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @returns Object containing encrypted data, IV, and auth tag (all as hex strings)
 */
export function encrypt(plaintext: string): {
    encryptedKey: string;
    iv: string;
    authTag: string;
} {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
        encryptedKey: encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
    };
}

/**
 * Decrypt an encrypted string using AES-256-GCM.
 * @param encryptedKey - The encrypted data as a hex string
 * @param iv - The initialization vector as a hex string
 * @param authTag - The authentication tag as a hex string
 * @returns The decrypted plaintext string
 */
export function decrypt(
    encryptedKey: string,
    iv: string,
    authTag: string
): string {
    const key = getEncryptionKey();
    const ivBuffer = Buffer.from(iv, "hex");
    const authTagBuffer = Buffer.from(authTag, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encryptedKey, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

/**
 * Generate a new random encryption key (for .env setup)
 * @returns A 64-character hex string suitable for ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

/**
 * Validate an API key by attempting to decrypt and checking format.
 * This is a basic validation - actual API validation should call the provider.
 */
export function validateDecryptedKey(
    decryptedKey: string,
    provider: "openai" | "anthropic" | "google" | "huggingface"
): boolean {
    if (!decryptedKey || decryptedKey.length < 20) {
        return false;
    }

    if (provider === "openai") {
        // OpenAI keys start with "sk-"
        return decryptedKey.startsWith("sk-");
    }

    if (provider === "anthropic") {
        // Anthropic keys start with "sk-ant-"
        return decryptedKey.startsWith("sk-ant-");
    }

    if (provider === "google") {
        // Google Gemini keys start with "AIza"
        return decryptedKey.startsWith("AIza");
    }

    if (provider === "huggingface") {
        // HuggingFace tokens start with "hf_"
        return decryptedKey.startsWith("hf_");
    }

    return false;
}
