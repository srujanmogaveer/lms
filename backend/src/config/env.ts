import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env (checks backend directory and cwd)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  frontendUrl: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    isConfigured: boolean;
  };
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    isConfigured: boolean;
  };
  ai: {
    provider: 'gemini' | 'openai';
    modelName: string;
    geminiApiKey: string;
    openaiApiKey: string;
    dailyMessageLimit: number;
    maxContextTokens: number;
    requestTimeoutMs: number;
    isConfigured: boolean;
  };
  livekit: {
    url: string;
    apiKey: string;
    apiSecret: string;
    isConfigured: boolean;
  };
  email: {
    provider: 'resend' | 'gmail' | 'smtp' | 'none';
    apiKey: string;
    from: string;
    smtpUser: string;
    smtpPass: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    isConfigured: boolean;
  };
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getEnvString = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const supabaseUrl = getEnvString('SUPABASE_URL', '');
const supabaseAnonKey = getEnvString('SUPABASE_ANON_KEY', '');
const supabaseServiceKey = getEnvString('SUPABASE_SERVICE_ROLE_KEY', '');

const razorpayKeyId = getEnvString('RAZORPAY_KEY_ID', 'rzp_test_placeholder_key_id');
const razorpayKeySecret = getEnvString('RAZORPAY_KEY_SECRET', 'rzp_test_placeholder_key_secret');
const razorpayWebhookSecret = getEnvString('RAZORPAY_WEBHOOK_SECRET', '');

// LiveKit Configuration
const livekitUrl = getEnvString('LIVEKIT_URL', 'wss://edusphere-demo.livekit.cloud');
const livekitApiKey = getEnvString('LIVEKIT_API_KEY', 'devkey');
const livekitApiSecret = getEnvString('LIVEKIT_API_SECRET', 'secret_key_placeholder_for_livekit_tokens_32chars');
const isLivekitConfigured = Boolean(
  livekitUrl &&
  livekitApiKey &&
  livekitApiSecret &&
  !livekitApiKey.includes('placeholder')
);

// AI Configuration
const aiProviderRaw = getEnvString('AI_PROVIDER', 'gemini').toLowerCase().trim();
const aiProvider: 'gemini' | 'openai' = aiProviderRaw === 'openai' ? 'openai' : 'gemini';
const defaultModelName = aiProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.6-flash';
const aiModelName = getEnvString('AI_MODEL_NAME', defaultModelName);
const geminiApiKey = getEnvString('GEMINI_API_KEY', '');
const openaiApiKey = getEnvString('OPENAI_API_KEY', '');
const aiDailyLimit = getEnvNumber('AI_DAILY_MESSAGE_LIMIT', 50);
const aiMaxContextTokens = getEnvNumber('AI_MAX_CONTEXT_TOKENS', 4000);
const aiRequestTimeoutMs = getEnvNumber('AI_REQUEST_TIMEOUT_MS', 30000);

const isAiConfigured = Boolean(
  (aiProvider === 'gemini' && geminiApiKey && !geminiApiKey.includes('placeholder') && !geminiApiKey.includes('your-key')) ||
  (aiProvider === 'openai' && openaiApiKey && !openaiApiKey.includes('placeholder') && !openaiApiKey.includes('your-key'))
);

// Email Configuration (Supports Gmail SMTP, Custom SMTP, or Resend API)
const resendApiKey = getEnvString('RESEND_API_KEY', process.env.EMAIL_API_KEY || '');
const smtpUser = getEnvString('SMTP_USER', process.env.GMAIL_USER || '');
const smtpPass = getEnvString('SMTP_PASS', process.env.GMAIL_APP_PASSWORD || '');
const smtpHost = getEnvString('SMTP_HOST', 'smtp.gmail.com');
const smtpPort = getEnvNumber('SMTP_PORT', 465);
const smtpSecure = process.env.SMTP_SECURE !== 'false';

const isGmailSmtp = Boolean(
  (smtpUser && smtpPass) &&
  !smtpUser.includes('your-email') &&
  !smtpPass.includes('your-app-password') &&
  !smtpPass.includes('placeholder')
);

const isResendConfigured = Boolean(
  resendApiKey &&
  !resendApiKey.includes('placeholder') &&
  !resendApiKey.includes('your-') &&
  resendApiKey.trim().length > 10
);

let emailProvider: 'resend' | 'gmail' | 'smtp' | 'none' = 'none';
if (isGmailSmtp) {
  emailProvider = smtpHost.includes('gmail') ? 'gmail' : 'smtp';
} else if (isResendConfigured) {
  emailProvider = 'resend';
}

const defaultEmailFrom = isGmailSmtp
  ? `EduSphere LMS <${smtpUser}>`
  : 'EduSphere LMS <onboarding@resend.dev>';

const emailFrom = getEnvString('EMAIL_FROM', defaultEmailFrom);
const isEmailConfigured = isGmailSmtp || isResendConfigured;

export const config: AppConfig = {
  port: getEnvNumber('PORT', 5000),
  nodeEnv: getEnvString('NODE_ENV', 'development'),
  isProduction: getEnvString('NODE_ENV', 'development') === 'production',
  isDevelopment: getEnvString('NODE_ENV', 'development') === 'development',
  frontendUrl: getEnvString('FRONTEND_URL', 'http://localhost:5173'),
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    serviceRoleKey: supabaseServiceKey,
    isConfigured: Boolean(
      supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('your-project-id')
    ),
  },
  razorpay: {
    keyId: razorpayKeyId,
    keySecret: razorpayKeySecret,
    webhookSecret: razorpayWebhookSecret,
    isConfigured: Boolean(
      razorpayKeyId &&
      razorpayKeySecret &&
      razorpayKeyId.startsWith('rzp_') &&
      !razorpayKeyId.includes('placeholder') &&
      !razorpayKeyId.includes('yourKeyIdHere') &&
      !razorpayKeySecret.includes('placeholder') &&
      !razorpayKeySecret.includes('yourKeySecretHere')
    ),
  },
  ai: {
    provider: aiProvider,
    modelName: aiModelName,
    geminiApiKey,
    openaiApiKey,
    dailyMessageLimit: aiDailyLimit,
    maxContextTokens: aiMaxContextTokens,
    requestTimeoutMs: aiRequestTimeoutMs,
    isConfigured: isAiConfigured,
  },
  livekit: {
    url: livekitUrl,
    apiKey: livekitApiKey,
    apiSecret: livekitApiSecret,
    isConfigured: isLivekitConfigured,
  },
  email: {
    provider: emailProvider,
    apiKey: resendApiKey,
    from: emailFrom,
    smtpUser,
    smtpPass,
    smtpHost,
    smtpPort,
    smtpSecure,
    isConfigured: isEmailConfigured,
  },
};
