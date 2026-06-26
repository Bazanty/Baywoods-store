import { getDarajaEnvironment, isPaymentMockEnabled } from "@/lib/mpesa";

export interface MpesaDiagnostics {
  provider: "daraja";
  environment: string;
  mockMode: boolean;
  callbackUrl: string | null;
  callbackUrlOk: boolean;
  callbackUrlIssues: string[];
  credentials: {
    consumerKey: boolean;
    consumerSecret: boolean;
    shortcode: boolean;
    passkey: boolean;
  };
  productionReady: boolean;
  warnings: string[];
}

export function getMpesaDiagnostics(): MpesaDiagnostics {
  const environment = getDarajaEnvironment();
  const mockMode = isPaymentMockEnabled();
  const callbackUrl =
    process.env.MPESA_CALLBACK_URL?.trim() || null;
  const callbackUrlIssues: string[] = [];
  const warnings: string[] = [];

  if (!callbackUrl) {
    callbackUrlIssues.push("MPESA_CALLBACK_URL is missing.");
  } else {
    try {
      const parsed = new URL(callbackUrl);
      if (parsed.protocol !== "https:") {
        callbackUrlIssues.push("Callback URL must use HTTPS — Safaricom rejects plain HTTP.");
      }
      if (parsed.pathname !== "/api/mpesa/callback") {
        callbackUrlIssues.push("Callback URL should point to /api/mpesa/callback.");
      }
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        callbackUrlIssues.push("Callback URL must be publicly reachable by Safaricom.");
      }
    } catch {
      callbackUrlIssues.push("MPESA_CALLBACK_URL is not a valid URL.");
    }
  }

  const credentials = {
    consumerKey: !!process.env.MPESA_CONSUMER_KEY?.trim(),
    consumerSecret: !!process.env.MPESA_CONSUMER_SECRET?.trim(),
    shortcode: !!process.env.MPESA_SHORTCODE?.trim(),
    passkey: !!process.env.MPESA_PASSKEY?.trim(),
  };

  if (environment === "production" && mockMode) {
    warnings.push("MPESA_MOCK is enabled while MPESA_ENVIRONMENT is production.");
  }
  if (!credentials.consumerKey) warnings.push("MPESA_CONSUMER_KEY is missing.");
  if (!credentials.consumerSecret) warnings.push("MPESA_CONSUMER_SECRET is missing.");
  if (!credentials.shortcode) warnings.push("MPESA_SHORTCODE is missing.");
  if (!credentials.passkey) warnings.push("MPESA_PASSKEY is missing.");

  const allCredentials =
    credentials.consumerKey &&
    credentials.consumerSecret &&
    credentials.shortcode &&
    credentials.passkey;

  const productionReady =
    environment === "production" &&
    !mockMode &&
    callbackUrlIssues.length === 0 &&
    allCredentials;

  return {
    provider: "daraja",
    environment,
    mockMode,
    callbackUrl,
    callbackUrlOk: callbackUrlIssues.length === 0,
    callbackUrlIssues,
    credentials,
    productionReady,
    warnings,
  };
}
