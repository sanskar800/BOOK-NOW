/**
 * Email configuration file
 * Contains email service credentials and settings for Mailtrap
 */

const emailConfig = {
  // Mailtrap credentials
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '828b65498becf1',
    pass: '3c53231ed59d12'
  },
  from: 'BookNow <notifications@booknow.com>',
  
  // Email sending options
  secure: false,
  connectionTimeout: 30000, // Increased timeout to 30 seconds
  greetingTimeout: 30000,
  socketTimeout: 30000
};

// Add retry logic for transient failures
emailConfig.retryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 5000 // 5 seconds
};

export default emailConfig; 