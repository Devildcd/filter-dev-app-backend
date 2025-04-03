import crypto from "crypto";
import User from "../models/userModel.js";

/**
 * Generates a unique 8-character access code.
 * @returns {Promise<string>} A unique access code.
 * @throws {Error} If unable to generate a unique code after max attempts.
 */
export const generateUniqueAccessCode = async () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789_"; // Sin caracteres especiales
    const codeLength = 8;
    const maxAttempts = 10;
  
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const code = Array.from(crypto.randomFillSync(Buffer.allocUnsafe(codeLength)))
        .map((byte) => characters[byte % characters.length])
        .join("");
  
      const exists = await User.exists({ access_code: code });
      if (!exists) return code;
    }
  
    throw new Error(`Unable to generate a unique access code after ${maxAttempts} attempts.`);
  };
  
