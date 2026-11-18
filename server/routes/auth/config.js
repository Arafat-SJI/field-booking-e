const config = {
  enabled: process.env.LOGIN_USER_MANAGEMENT_ENABLED !== 'false',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM,
};

module.exports = config;
