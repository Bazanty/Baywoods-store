export const MPESA_FAILURE_MESSAGES: Record<string, string> = {
  "1": "M-Pesa could not complete the payment. Check your balance and try again.",
  "17": "M-Pesa payment failed because the request timed out.",
  "20": "M-Pesa payment failed because the request could not be processed.",
  "26": "M-Pesa payment failed because the phone number was unreachable.",
  "1032": "M-Pesa payment was cancelled before completion.",
  "1037": "M-Pesa payment timed out because the PIN prompt was not completed.",
  "1019": "M-Pesa payment expired before completion.",
  "2001": "M-Pesa payment failed because the PIN was incorrect.",
};

export function mpesaResultMessage(code: string | number | null | undefined, fallback?: string) {
  if (code == null) return fallback ?? "M-Pesa payment is still pending.";
  return MPESA_FAILURE_MESSAGES[String(code)] ?? fallback ?? "M-Pesa payment was not completed.";
}
