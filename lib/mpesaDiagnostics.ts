import { getLipanaEnvironment, isPaymentMockEnabled } from "@/lib/mpesa";

export interface MpesaDiagnostics {
  provider: "lipana";
  environment: string;
  mockMode: boolean;
  skipSignatureCheck: boolean;
  callbackUrl: string | null;
  callbackUrlOk: boolean;
  callbackUrlIssues: string[];
  credentials: {
    secretKey: boolean;
    webhookSecret: boolean;
  };
  productionReady: boolean;
  warnings: string[];
}

export function getMpesaDiagnostics(): MpesaDiagnostics {
  const environment = getLipanaEnvironment();
  const mockMode = isPaymentMockEnabled();
  const skipSignatureCheck = process.env.LIPANA_SKIP_SIGNATURE_CHECK === "true";
  const callbackUrl =
    process.env.LIPANA_WEBHOOK_URL?.trim() ||
    process.env.MPESA_CALLBACK_URL?.trim() ||
    null;
  const callbackUrlIssues: string[] = [];
  const warnings: string[] = [];

  if (!callbackUrl) {
    callbackUrlIssues.push("LIPANA_WEBHOOK_URL is missing.");
  } else {
    try {
      const parsed = new URL(callbackUrl);
      if (parsed.protocol !== "https:") {
        callbackUrlIssues.push("Webhook URL must use HTTPS in production.");
      }
      if (parsed.pathname !== "/api/mpesa/callback") {
        callbackUrlIssues.push("Webhook URL should point to /api/mpesa/callback.");
      }
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        callbackUrlIssues.push("Webhook URL must be publicly reachable by Lipana.");
      }
    } catch {
      callbackUrlIssues.push("LIPANA_WEBHOOK_URL is not a valid URL.");
    }
  }

  const credentials = {
    secretKey: !!process.env.LIPANA_SECRET_KEY,
    webhookSecret: !!process.env.LIPANA_WEBHOOK_SECRET,
  };

  if (environment === "production" && mockMode) {
    warnings.push("Payment mock mode is enabled while LIPANA_ENVIRONMENT is production.");
  }
  if (environment === "production" && skipSignatureCheck) {
    warnings.push("LIPANA_SKIP_SIGNATURE_CHECK is enabled in production.");
  }
  if (!credentials.secretKey) {
    warnings.push("LIPANA_SECRET_KEY is missing.");
  }
  if (!credentials.webhookSecret && !skipSignatureCheck) {
    warnings.push("LIPANA_WEBHOOK_SECRET is missing.");
  }
  if (process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_SECRET || process.env.MPESA_PASSKEY) {
    warnings.push("Daraja MPESA_* credentials are no longer used for checkout.");
  }

  const productionReady =
    environment === "production" &&
    !mockMode &&
    !skipSignatureCheck &&
    callbackUrlIssues.length === 0 &&
    credentials.secretKey &&
    credentials.webhookSecret;

  return {
    provider: "lipana",
    environment,
    mockMode,
    skipSignatureCheck,
    callbackUrl,
    callbackUrlOk: callbackUrlIssues.length === 0,
    callbackUrlIssues,
    credentials,
    productionReady,
    warnings,
  };
}
