import dotenv from 'dotenv';
import { logEmailConfig, sendEmail } from '../services/emailService.js';

dotenv.config();

await logEmailConfig();

const to = process.argv[2];
if (!to) {
  console.log('Usage: node scripts/test-smtp.mjs <recipient-email>');
  process.exit(1);
}

try {
  const result = await sendEmail({
    to,
    subject: 'HireRight email test',
    html: '<p>If you received this, your email provider is configured correctly.</p>',
    context: 'smtp-test'
  });
  console.log('Test email sent:', result.messageId);
} catch (err) {
  console.error('Test failed:', err.message);
  process.exit(1);
}
