import crypto from "crypto";

export const jwtSecretKey = crypto.randomBytes(32).toString("hex");

// const sessionSecretKey = crypto.randomBytes(32).toString("hex");
// console.log(`SESSION_SECRET=${sessionSecretKey}`);
