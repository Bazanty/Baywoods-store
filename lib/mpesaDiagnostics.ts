export interface MpesaDiagnostics {
  environment: string;
  mockMode: boolean;
  skipIpCheck: boolean;
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
  const environment = process.env.MPESA_ENVIRONMENT ?? "sandbox";
  const mockMode = process.env.MPESA_MOCK === "true";
  const skipIpCheck = process.env.MPESA_SKIP_IP_CHECK === "true";
  const callbackUrl = process.env.MPESA_CALLBACK_URL?.trim() || null;
  const callbackUrlIssues: string[] = [];
  const warnings: string[] = [];

  if (!callbackUrl) {
    callbackUrlIssues.push("MPESA_CALLBACK_URL is missing.");
  } else {
    try {
      const parsed = new URL(callbackUrl);
      if (parsed.protocol !== "https:") {
        callbackUrlIssues.push("Callback URL must use HTTPS in production.");
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
    consumerKey: !!process.env.MPESA_CONSUMER_KEY,
    consumerSecret: !!process.env.MPESA_CONSUMER_SECRET,
    shortcode: !!process.env.MPESA_SHORTCODE,
    passkey: !!process.env.MPESA_PASSKEY,
  };

  if (environment === "production" && mockMode) {
    warnings.push("MPESA_MOCK is enabled while MPESA_ENVIRONMENT is production.");
  }
  if (environment === "production" && skipIpCheck) {
    warnings.push("MPESA_SKIP_IP_CHECK is enabled in production.");
  }
  if (!credentials.consumerKey || !credentials.consumerSecret) {
    warnings.push("Daraja consumer credentials are incomplete.");
  }
  if (environment === "production" && (!credentials.shortcode || !credentials.passkey)) {
    warnings.push("Production shortcode or passkey is missing.");
  }

  const productionReady =
    environment === "production" &&
    !mockMode &&
    !skipIpCheck &&
    callbackUrlIssues.length === 0 &&
    Object.values(credentials).every(Boolean);

  return {
    environment,
    mockMode,
    skipIpCheck,
    callbackUrl,
    callbackUrlOk: callbackUrlIssues.length === 0,
    callbackUrlIssues,
    credentials,
    productionReady,
    warnings,
  };
}
