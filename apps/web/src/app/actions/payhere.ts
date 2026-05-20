"use server";

import crypto from 'crypto';

export async function generatePayhereHash(
  merchantId: string, 
  orderId: string, 
  amount: string, 
  currency: string, 
  merchantSecret: string
) {
  // 1. Format the amount to exactly two decimal places (e.g. 1000.00)
  const amountFormatted = parseFloat(amount).toFixed(2);

  // 2. Hash the merchant secret (MD5 -> Uppercase Hex)
  const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();

  // 3. Concatenate all required elements exactly as per PayHere docs
  const hashString = `${merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`;

  // 4. Hash the concatenated string (MD5 -> Uppercase Hex)
  const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

  return hash;
}
