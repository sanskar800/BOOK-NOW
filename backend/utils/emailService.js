import nodemailer from 'nodemailer';
import emailConfig from '../config/email.js';

/**
 * Send an email using Mailtrap
 * @param {string} to - recipient email address
 * @param {string} subject - email subject
 * @param {string} html - email body in HTML format
 * @returns {Promise} - email sending result
 */
export const sendEmail = async (to, subject, html) => {
  try {
    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport(emailConfig);
    
    // Send the email
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a random OTP
 * @param {number} length - OTP length
 * @returns {string} - generated OTP
 */
export const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

/**
 * Create HTML content for password reset email with OTP
 * @param {string} name - user's name
 * @param {string} otp - one-time password
 * @returns {string} - HTML email content
 */
export const createPasswordResetEmailHTML = (name, otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2; text-align: center;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password. Here is your One-Time Password (OTP):</p>
      <div style="text-align: center; margin: 20px 0;">
        <div style="background-color: #f2f2f2; padding: 15px; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
      </div>
      <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
      <p>If you didn't request a password reset, please ignore this email or contact our support.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email from BookNow.</p>
      </div>
    </div>
  `;
};

/**
 * Create HTML content for booking confirmation email
 * @param {Object} booking - booking details
 * @param {Object} user - user details
 * @param {Object} hotel - hotel details
 * @returns {string} - HTML email content
 */
export const createBookingConfirmationEmailHTML = (booking, user, hotel) => {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2; text-align: center;">Booking Confirmation</h2>
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="background-color: #4a90e2; color: white; padding: 10px; border-radius: 5px; font-size: 18px; font-weight: bold;">
          Booking #${booking._id}
        </div>
      </div>
      
      <p>Hello ${user.name},</p>
      <p>Your booking at <strong>${hotel.name}</strong> has been confirmed. Here are the details:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Hotel:</strong> ${hotel.name}</p>
        <p style="margin: 5px 0;"><strong>Room Type:</strong> ${booking.roomType}</p>
        <p style="margin: 5px 0;"><strong>Number of Rooms:</strong> ${booking.roomQuantity}</p>
        <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${checkInDate}</p>
        <p style="margin: 5px 0;"><strong>Check-out Date:</strong> ${checkOutDate}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${booking.paymentStatus}</p>
      </div>
      
      <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #4a90e2;">Hotel Information</h3>
        <p style="margin: 5px 0;"><strong>Address:</strong> ${hotel.address.line1}, ${hotel.address.line2}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${hotel.location}</p>
      </div>
      
      <p>Thank you for choosing BookNow. We hope you enjoy your stay!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email from BookNow. Please do not reply to this email.</p>
        <p>If you have any questions, please contact our customer support.</p>
      </div>
    </div>
  `;
};

/**
 * Create HTML content for booking confirmation email to hotel
 * @param {Object} booking - booking details
 * @param {Object} user - user details
 * @param {Object} hotel - hotel details
 * @returns {string} - HTML email content
 */
export const createHotelBookingNotificationHTML = (booking, user, hotel) => {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2; text-align: center;">New Booking Received</h2>
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="background-color: #4a90e2; color: white; padding: 10px; border-radius: 5px; font-size: 18px; font-weight: bold;">
          Booking #${booking._id}
        </div>
      </div>
      
      <p>Hello ${hotel.name} Team,</p>
      <p>You have received a new booking. Here are the details:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Guest Name:</strong> ${user.name}</p>
        <p style="margin: 5px 0;"><strong>Guest Email:</strong> ${user.email}</p>
        <p style="margin: 5px 0;"><strong>Guest Phone:</strong> ${user.phone || 'Not provided'}</p>
        <p style="margin: 5px 0;"><strong>Room Type:</strong> ${booking.roomType}</p>
        <p style="margin: 5px 0;"><strong>Number of Rooms:</strong> ${booking.roomQuantity}</p>
        <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${checkInDate}</p>
        <p style="margin: 5px 0;"><strong>Check-out Date:</strong> ${checkOutDate}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${booking.paymentStatus}</p>
      </div>
      
      <p>Please prepare for the guest's arrival. You can manage this booking from your hotel dashboard.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email from BookNow. Please do not reply to this email.</p>
      </div>
    </div>
  `;
};

/**
 * Create HTML content for booking cancellation email to user
 * @param {Object} booking - booking details
 * @param {Object} hotel - hotel details
 * @param {string} cancelledBy - who cancelled the booking ('user', 'hotel', or 'admin')
 * @param {string} cancellationReason - reason for cancellation
 * @returns {string} - HTML email content
 */
export const createBookingCancellationEmailHTML = (booking, hotel, cancelledBy, cancellationReason) => {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Get user name safely, handling when userId might not be populated
  const userName = booking.userId?.name || 'Valued Customer';
  
  let cancellationMessage = '';
  if (cancelledBy === 'user') {
    cancellationMessage = 'You have cancelled your booking.';
  } else if (cancelledBy === 'hotel') {
    cancellationMessage = 'The hotel has cancelled your booking.';
  } else {
    cancellationMessage = 'Your booking has been cancelled.';
  }
  
  // Determine payment/refund status message
  let paymentStatusHTML = '';
  if (booking.paymentStatus === 'Refunded') {
    paymentStatusHTML = `
      <p style="padding: 10px; background-color: #f0f7ff; border-radius: 4px; margin: 15px 0;">
        <strong>Payment Status:</strong> Refunded<br>
        <strong>Refund Information:</strong> Your refund has been processed and will be credited to your account within 2-3 business days.
      </p>
    `;
  } else if (booking.paymentStatus === 'Completed') {
    paymentStatusHTML = `
      <p style="padding: 10px; background-color: #fff8e6; border-radius: 4px; margin: 15px 0;">
        <strong>Payment Status:</strong> Paid<br>
        <strong>Note:</strong> A refund will be processed shortly.
      </p>
    `;
  }
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #e53e3e;">Booking Cancellation Confirmation</h2>
      <p>Dear ${userName},</p>
      <p>${cancellationMessage} Here are the details of the cancelled booking:</p>
      ${cancellationReason ? `<p><strong>Cancellation Reason:</strong> ${cancellationReason}</p>` : ''}
      <p><strong>Booking Details:</strong></p>
      <ul>
        <li>Check-in Date: ${checkInDate}</li>
        <li>Check-out Date: ${checkOutDate}</li>
        <li>Room Type: ${booking.roomType}</li>
        <li>Number of Rooms: ${booking.roomQuantity}</li>
        <li>Total Amount: ${booking.totalAmount}</li>
      </ul>
      ${paymentStatusHTML}
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>BookNow Team</p>
    </div>
  `;
};

/**
 * Create HTML content for booking cancellation notification to hotel
 * @param {Object} booking - booking details
 * @param {Object} user - user details
 * @param {string} cancelledBy - who cancelled the booking ('user', 'hotel', or 'admin')
 * @param {string} cancellationReason - reason for cancellation
 * @returns {string} - HTML email content
 */
export const createHotelBookingCancellationHTML = (booking, user, cancelledBy, cancellationReason) => {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Get guest info safely
  const guestName = user?.name || 'Guest';
  const guestEmail = user?.email || 'Not available';
  
  let cancellationMessage = '';
  if (cancelledBy === 'user') {
    cancellationMessage = 'The guest has cancelled their booking.';
  } else if (cancelledBy === 'hotel') {
    cancellationMessage = 'You have cancelled this booking.';
  } else {
    cancellationMessage = 'This booking has been cancelled.';
  }
  
  // Determine payment/refund status message
  let paymentStatusHTML = '';
  if (booking.paymentStatus === 'Refunded') {
    paymentStatusHTML = `
      <p style="padding: 10px; background-color: #f0f7ff; border-radius: 4px; margin: 15px 0;">
        <strong>Payment Status:</strong> Refunded<br>
        <strong>Refund Information:</strong> The payment has been fully refunded to the guest.
      </p>
    `;
  } else if (booking.paymentStatus === 'Completed') {
    paymentStatusHTML = `
      <p style="padding: 10px; background-color: #fff8e6; border-radius: 4px; margin: 15px 0;">
        <strong>Payment Status:</strong> Paid<br>
        <strong>Note:</strong> A refund will be processed for this booking.
      </p>
    `;
  }
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #e53e3e;">Booking Cancellation Notification</h2>
      <p>Dear Hotel Management,</p>
      <p>${cancellationMessage} Here are the details of the cancelled booking:</p>
      ${cancellationReason ? `<p><strong>Cancellation Reason:</strong> ${cancellationReason}</p>` : ''}
      <p><strong>Booking Details:</strong></p>
      <ul>
        <li>Guest Name: ${guestName}</li>
        <li>Guest Email: ${guestEmail}</li>
        <li>Check-in Date: ${checkInDate}</li>
        <li>Check-out Date: ${checkOutDate}</li>
        <li>Room Type: ${booking.roomType}</li>
        <li>Number of Rooms: ${booking.roomQuantity}</li>
        <li>Total Amount: ${booking.totalAmount}</li>
        <li>Payment Status: ${booking.paymentStatus}</li>
      </ul>
      ${paymentStatusHTML}
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>BookNow Team</p>
    </div>
  `;
};

/**
 * Create HTML content for payment confirmation email to user
 * @param {Object} booking - booking details
 * @param {Object} user - user details
 * @param {Object} hotel - hotel details
 * @returns {string} - HTML email content
 */
export const createPaymentConfirmationEmailHTML = (booking, user, hotel) => {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2; text-align: center;">Payment Confirmation</h2>
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="background-color: #28a745; color: white; padding: 10px; border-radius: 5px; font-size: 18px; font-weight: bold;">
          Payment Successful
        </div>
      </div>
      
      <p>Hello ${user.name},</p>
      <p>Your payment for the booking at <strong>${hotel.name}</strong> has been successfully processed. Here are the details:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking._id}</p>
        <p style="margin: 5px 0;"><strong>Hotel:</strong> ${hotel.name}</p>
        <p style="margin: 5px 0;"><strong>Room Type:</strong> ${booking.roomType}</p>
        <p style="margin: 5px 0;"><strong>Number of Rooms:</strong> ${booking.roomQuantity}</p>
        <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${checkInDate}</p>
        <p style="margin: 5px 0;"><strong>Check-out Date:</strong> ${checkOutDate}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 5px 0;"><strong>Payment Status:</strong> Completed</p>
      </div>
      
      <p>Thank you for choosing BookNow. We hope you enjoy your stay!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email from BookNow. Please do not reply to this email.</p>
        <p>If you have any questions, please contact our customer support.</p>
      </div>
    </div>
  `;
};

/**
 * Create HTML content for payment confirmation email to hotel
 * @param {Object} booking - booking details
 * @param {Object} user - user details
 * @param {Object} hotel - hotel details
 * @returns {string} - HTML email content
 */
export const createHotelPaymentConfirmationHTML = (booking, user, hotel) => {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2; text-align: center;">Payment Confirmation</h2>
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="background-color: #28a745; color: white; padding: 10px; border-radius: 5px; font-size: 18px; font-weight: bold;">
          Payment Received
        </div>
      </div>
      
      <p>Hello ${hotel.name} Team,</p>
      <p>We're pleased to inform you that payment has been received for the following booking:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking._id}</p>
        <p style="margin: 5px 0;"><strong>Guest Name:</strong> ${user.name}</p>
        <p style="margin: 5px 0;"><strong>Guest Email:</strong> ${user.email}</p>
        <p style="margin: 5px 0;"><strong>Guest Phone:</strong> ${user.phone || 'Not provided'}</p>
        <p style="margin: 5px 0;"><strong>Room Type:</strong> ${booking.roomType}</p>
        <p style="margin: 5px 0;"><strong>Number of Rooms:</strong> ${booking.roomQuantity}</p>
        <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${checkInDate}</p>
        <p style="margin: 5px 0;"><strong>Check-out Date:</strong> ${checkOutDate}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 5px 0;"><strong>Payment Status:</strong> Completed</p>
      </div>
      
      <p>Please prepare for the guest's arrival. You can manage this booking from your hotel dashboard.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email from BookNow. Please do not reply to this email.</p>
      </div>
    </div>
  `;
};

/**
 * Create HTML content for refund confirmation email to user
 * @param {Object} booking - booking details
 * @param {Object} user - user details
 * @param {Object} hotel - hotel details
 * @returns {string} - HTML email content
 */
export const createRefundConfirmationEmailHTML = (booking, user, hotel) => {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2; text-align: center;">Refund Confirmation</h2>
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="background-color: #28a745; color: white; padding: 10px; border-radius: 5px; font-size: 18px; font-weight: bold;">
          Refund Processed Successfully
        </div>
      </div>
      
      <p>Hello ${user.name},</p>
      <p>We're pleased to inform you that the refund for your cancelled booking at <strong>${hotel.name}</strong> has been processed. Here are the details:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking._id}</p>
        <p style="margin: 5px 0;"><strong>Hotel:</strong> ${hotel.name}</p>
        <p style="margin: 5px 0;"><strong>Room Type:</strong> ${booking.roomType}</p>
        <p style="margin: 5px 0;"><strong>Number of Rooms:</strong> ${booking.roomQuantity}</p>
        <p style="margin: 5px 0;"><strong>Original Check-in Date:</strong> ${checkInDate}</p>
        <p style="margin: 5px 0;"><strong>Original Check-out Date:</strong> ${checkOutDate}</p>
        <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 5px 0;"><strong>Refund Status:</strong> Processed</p>
      </div>
      
      <p>Please note that it may take 5-7 business days for the refunded amount to appear in your account, depending on your bank or payment provider.</p>
      <p>Thank you for choosing BookNow. We hope to serve you again in the future!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email from BookNow. Please do not reply to this email.</p>
        <p>If you have any questions about your refund, please contact our customer support.</p>
      </div>
    </div>
  `;
};

/**
 * Create HTML content for refund notification email to hotel
 * @param {Object} booking - booking details
 * @param {Object} user - user details
 * @param {Object} hotel - hotel details
 * @returns {string} - HTML email content
 */
export const createHotelRefundNotificationHTML = (booking, user, hotel) => {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #4a90e2; text-align: center;">Refund Notification</h2>
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="background-color: #28a745; color: white; padding: 10px; border-radius: 5px; font-size: 18px; font-weight: bold;">
          Refund Processed
        </div>
      </div>
      
      <p>Hello ${hotel.name} Team,</p>
      <p>This is to inform you that a refund has been processed for a cancelled booking. Here are the details:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking._id}</p>
        <p style="margin: 5px 0;"><strong>Guest Name:</strong> ${user.name}</p>
        <p style="margin: 5px 0;"><strong>Guest Email:</strong> ${user.email}</p>
        <p style="margin: 5px 0;"><strong>Room Type:</strong> ${booking.roomType}</p>
        <p style="margin: 5px 0;"><strong>Number of Rooms:</strong> ${booking.roomQuantity}</p>
        <p style="margin: 5px 0;"><strong>Original Check-in Date:</strong> ${checkInDate}</p>
        <p style="margin: 5px 0;"><strong>Original Check-out Date:</strong> ${checkOutDate}</p>
        <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹${booking.totalAmount}</p>
        <p style="margin: 5px 0;"><strong>Refund Status:</strong> Processed</p>
      </div>
      
      <p>This booking has been marked as refunded in your dashboard.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #777; font-size: 12px;">
        <p>This is an automated email from BookNow. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}; 