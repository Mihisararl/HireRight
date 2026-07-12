import nodemailer from 'nodemailer';

const BREVO_DEFAULT_HOST = 'smtp-relay.brevo.com';
const BREVO_DEFAULT_PORT = 587;

const stripEnvQuotes = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const maskSecret = (value) => {
  if (!value) return 'MISSING';
  if (value.length <= 4) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
};

const getEmailProvider = () => {
  const provider = stripEnvQuotes(process.env.EMAIL_PROVIDER)?.toLowerCase();
  if (provider === 'brevo' || stripEnvQuotes(process.env.BREVO_SMTP_KEY)) {
    return 'brevo';
  }
  return provider || 'smtp';
};

const getSmtpConfig = () => {
  const provider = getEmailProvider();
  const from =
    stripEnvQuotes(process.env.SMTP_FROM_EMAIL) ||
    stripEnvQuotes(process.env.BREVO_SMTP_LOGIN) ||
    stripEnvQuotes(process.env.SMTP_USER);

  if (provider === 'brevo') {
    const user = stripEnvQuotes(process.env.BREVO_SMTP_LOGIN) || stripEnvQuotes(process.env.SMTP_USER);
    const pass = stripEnvQuotes(process.env.BREVO_SMTP_KEY) || stripEnvQuotes(process.env.SMTP_PASS);
    const port = Number(stripEnvQuotes(process.env.BREVO_SMTP_PORT) || BREVO_DEFAULT_PORT);

    return {
      provider,
      host: stripEnvQuotes(process.env.BREVO_SMTP_HOST) || BREVO_DEFAULT_HOST,
      port,
      secure: port === 465,
      user,
      pass,
      from: from || user
    };
  }

  const host = stripEnvQuotes(process.env.SMTP_HOST);
  const port = Number(stripEnvQuotes(process.env.SMTP_PORT) || 587);
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465;
  const user = stripEnvQuotes(process.env.SMTP_USER);
  const pass = stripEnvQuotes(process.env.SMTP_PASS);

  return {
    provider,
    host,
    port,
    secure,
    user,
    pass,
    from: from || user
  };
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const { host, port, secure, user, pass, provider } = getSmtpConfig();

    if (!host) {
      throw new Error(
        provider === 'brevo'
          ? 'Brevo SMTP is not configured. Set BREVO_SMTP_KEY and BREVO_SMTP_LOGIN.'
          : 'SMTP_HOST is not configured'
      );
    }

    const transportOptions = {
      host,
      port,
      secure,
      requireTLS: !secure && port === 587,
      tls: {
        minVersion: 'TLSv1.2'
      }
    };

    if (user && pass) {
      transportOptions.auth = { user, pass };
    }

    transporter = nodemailer.createTransport(transportOptions);
  }

  return transporter;
};

export const logEmailConfig = async () => {
  const { provider, host, port, secure, user, from, pass } = getSmtpConfig();
  const frontendUrl = stripEnvQuotes(process.env.FRONTEND_URL) || 'http://localhost:3000';

  console.log('[email] Email provider:', provider);
  console.log('[email] SMTP host:', host || 'MISSING');
  console.log('[email] SMTP port:', port);
  console.log('[email] SMTP secure:', secure);
  console.log('[email] SMTP user:', user || 'MISSING');
  console.log('[email] SMTP password/key:', maskSecret(pass));
  console.log('[email] From address:', from || 'MISSING');
  console.log('[email] Frontend URL:', frontendUrl);

  if (provider === 'brevo') {
    console.log('[email] Brevo sender must be verified at https://app.brevo.com/senders');
  }

  if (!host || !from) {
    console.error('[email] Email host and SMTP_FROM_EMAIL are required for sending emails');
    return;
  }

  if (provider === 'brevo' && !pass) {
    console.error('[email] BREVO_SMTP_KEY is missing — add your Brevo SMTP key to .env');
    return;
  }

  try {
    await getTransporter().verify();
    console.log('[email] SMTP connection verified successfully');
  } catch (err) {
    console.error('[email] SMTP connection verification failed:', err.message);
  }
};

export const sendEmail = async ({ to, subject, html, context = 'email' }) => {
  const normalizedTo = String(to || '').trim().toLowerCase();
  const { from } = getSmtpConfig();

  if (!normalizedTo) {
    throw new Error('Recipient email is required');
  }

  if (!from) {
    throw new Error('SMTP_FROM_EMAIL is not configured');
  }

  console.log(`[email:${context}] Sending email`);
  console.log(`[email:${context}] From:`, from);
  console.log(`[email:${context}] To:`, normalizedTo);
  console.log(`[email:${context}] Subject:`, subject);

  try {
    const mailer = getTransporter();
    const result = await mailer.sendMail({
      from,
      to: normalizedTo,
      subject,
      html
    });

    console.log(`[email:${context}] Nodemailer response:`, JSON.stringify({
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response
    }, null, 2));

    return result;
  } catch (err) {
    console.error(`[email:${context}] Nodemailer error:`, err.message);
    if (err.response) {
      console.error(`[email:${context}] SMTP response:`, err.response);
    }
    console.error(`[email:${context}] Stack:`, err.stack);

    const wrapped = new Error(err.message || 'Failed to send email');
    wrapped.mailError = {
      code: err.code,
      command: err.command,
      response: err.response
    };
    throw wrapped;
  }
};

export const buildVerificationEmailHtml = ({ name, verifyUrl }) => `
  <h2>Welcome to HireRight, ${name}!</h2>
  <p>Please verify your email by clicking below:</p>
  <a href="${verifyUrl}"
     style="display:inline-block;padding:10px 20px;background:#0066ff;color:#fff;text-decoration:none;border-radius:5px;">
     Verify Email
  </a>
  <p>If the button does not work, copy and paste this link into your browser:</p>
  <p>${verifyUrl}</p>
  <p>This link expires in 24 hours.</p>
`;

export const buildPasswordResetEmailHtml = ({ name, resetUrl }) => `
  <h2>Password reset request</h2>
  <p>Hi ${name},</p>
  <p>We received a request to reset your password. Click the button below to choose a new password:</p>
  <a href="${resetUrl}"
     style="display:inline-block;padding:10px 20px;background:#0066ff;color:#fff;text-decoration:none;border-radius:5px;">
     Reset Password
  </a>
  <p>If the button does not work, copy and paste this link into your browser:</p>
  <p>${resetUrl}</p>
  <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
`;

export const buildVerificationUrl = (token) => {
  const baseUrl = (stripEnvQuotes(process.env.FRONTEND_URL) || 'http://localhost:3000').replace(/\/$/, '');
  const url = `${baseUrl}/verify/${token}`;
  console.log('[email] Verification URL:', url);
  return url;
};

export const buildPasswordResetUrl = (token) => {
  const baseUrl = (stripEnvQuotes(process.env.FRONTEND_URL) || 'http://localhost:3000').replace(/\/$/, '');
  return `${baseUrl}/reset-password/${token}`;
};
