import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { getAppUrl } from '@/lib/fulfillment-token';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const getFromEmail = () => {
  return process.env.RESEND_FROM_EMAIL || 'Agent Croww <orders@agentcroww.com>';
};

/**
 * 1. Instant Buyer Receipt (Hour 0)
 * Reassures the buyer their payment was received and credentials will arrive within 24 hours.
 */
export async function sendBuyerReceiptEmail({
  buyerEmail,
  buyerName,
  courseTitle,
  orderId,
  amountPaid,
}: {
  buyerEmail: string;
  buyerName: string;
  courseTitle: string;
  orderId: string;
  amountPaid: number;
}): Promise<EmailDispatchResult> {
  const subject = `Order Confirmed: ${courseTitle} (Login credentials arriving within 24 hours)`;

  const textBody = `Hi ${buyerName},

Thank you for your enrollment in ${courseTitle}!

Your payment of ₹${amountPaid.toFixed(2)} was received successfully (Order ID: #${orderId.slice(-8)}).

IMPORTANT - NEXT STEPS:
The course creator has been automatically notified and is provisioning your account access. Your personalized login credentials and course portal link will be emailed to you at ${buyerEmail} within the next 24 hours.

If you don't receive them within 24 hours, or have any questions, you can reply directly to this email or contact support at team@agentcroww.com.

Best regards,
The Agent Croww Team`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmed</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header Logo / Tag -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
            <span style="font-weight: 800; font-size: 18px; color: #ffffff; letter-spacing: -0.02em;">Agent Croww</span>
            <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.3);">
              ✓ PAYMENT VERIFIED
            </span>
          </div>

          <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">
            You're enrolled in <span style="color: #38bdf8;">${courseTitle}</span>!
          </h1>

          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
            Hi <strong style="color: #ffffff;">${buyerName}</strong>, thank you for your order. We have successfully confirmed your seat.
          </p>

          <!-- Order Summary Card -->
          <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="color: #94a3b8; padding: 6px 0;">Order Reference:</td>
                <td style="color: #ffffff; font-weight: 600; text-align: right; font-family: monospace;">#${orderId.slice(-8)}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; padding: 6px 0;">Amount Paid:</td>
                <td style="color: #34d399; font-weight: 700; text-align: right; font-size: 16px;">₹${amountPaid.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; padding: 6px 0;">Registered Email:</td>
                <td style="color: #ffffff; font-weight: 500; text-align: right;">${buyerEmail}</td>
              </tr>
            </table>
          </div>

          <!-- 24-Hour SLA Delivery Box -->
          <div style="background: linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(16, 185, 129, 0.08)); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 18px;">⏳</span>
              <strong style="color: #38bdf8; font-size: 15px;">Access Credentials Arriving Within 24 Hours</strong>
            </div>
            <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6; margin: 0;">
              The course creator has been notified to provision your account. Your login link and initial credentials will be sent to this email address within <strong>24 hours</strong>.
            </p>
          </div>

          <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 0;">
            Please keep an eye on your inbox and promotions/spam folder. For support anytime, reply directly to this email or reach us at <a href="mailto:team@agentcroww.com" style="color: #38bdf8; text-decoration: none;">team@agentcroww.com</a>.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(buyerEmail, subject, textBody, htmlBody);
}

/**
 * 2. Instant Vendor Action Required Notification (Hour 0)
 * Contains buyer info, net payout, and the 1-Click Magic Link "Confirm Access Granted".
 */
export async function sendVendorOrderAlertEmail({
  vendorEmail,
  buyerName,
  buyerEmail,
  buyerPhone,
  courseTitle,
  orderId,
  netPayout,
  magicLinkUrl,
}: {
  vendorEmail: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  courseTitle: string;
  orderId: string;
  netPayout: number;
  magicLinkUrl: string;
}): Promise<EmailDispatchResult> {
  const subject = `🚨 ACTION REQUIRED: Fulfill Access for ${courseTitle} (Order #${orderId.slice(-8)})`;

  const phoneText = buyerPhone ? `\n- Phone / WhatsApp: +91 ${buyerPhone}` : '';

  const textBody = `Great news! You made a new sale for ${courseTitle}.

YOUR NET PAYOUT: ₹${netPayout.toFixed(2)} (80% net earnings)

BUYER DETAILS:
- Name: ${buyerName}
- Email: ${buyerEmail}${phoneText}
- Order ID: #${orderId.slice(-8)}

24-HOUR FULFILLMENT SLA:
Please provision this student's account on your course platform (Teachable, Graphy, Kajabi, or custom portal).

1-CLICK PROOF OF DELIVERY:
Once access is provisioned, confirm fulfillment instantly by clicking:
${magicLinkUrl}

Clicking this confirms delivery, automatically emails the student their login instructions, and starts your payout settlement clock.

Questions? Reply directly to this email.`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Action Required: Fulfill Course Access</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header Badge -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <span style="font-weight: 800; font-size: 18px; color: #ffffff;">Agent Croww</span>
            <span style="display: inline-block; background-color: rgba(239, 68, 68, 0.15); color: #f87171; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(239, 68, 68, 0.3);">
              🚨 24-HOUR SLA ACTION REQUIRED
            </span>
          </div>

          <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">
            New Sale: <span style="color: #38bdf8;">${courseTitle}</span>
          </h1>

          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
            A student has purchased your course. Please grant them access in your LMS and click the button below to complete fulfillment.
          </p>

          <!-- Net Payout Banner -->
          <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
            <div style="font-size: 12px; text-transform: uppercase; color: #34d399; font-weight: 700; letter-spacing: 0.05em;">Your Net Payout (80%)</div>
            <div style="font-size: 28px; font-weight: 900; color: #34d399; margin-top: 4px;">₹${netPayout.toFixed(2)}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Locked until delivery is confirmed below.</div>
          </div>

          <!-- Buyer Details Card -->
          <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 18px 20px; margin-bottom: 28px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px;">Student Information</div>
            <p style="margin: 6px 0; font-size: 14px; color: #f8fafc;">
              <strong style="color: #94a3b8;">Name:</strong> ${buyerName}
            </p>
            <p style="margin: 6px 0; font-size: 14px; color: #f8fafc;">
              <strong style="color: #94a3b8;">Email:</strong> <a href="mailto:${buyerEmail}" style="color: #38bdf8; text-decoration: none; font-weight: 600;">${buyerEmail}</a>
            </p>
            ${buyerPhone ? `
            <p style="margin: 6px 0; font-size: 14px; color: #f8fafc;">
              <strong style="color: #94a3b8;">WhatsApp / Phone:</strong> <a href="https://wa.me/91${buyerPhone.slice(-10)}" style="color: #34d399; text-decoration: none; font-weight: 600;">+91 ${buyerPhone}</a>
            </p>` : ''}
            <p style="margin: 6px 0; font-size: 14px; color: #f8fafc;">
              <strong style="color: #94a3b8;">Order ID:</strong> <code style="background-color: #1e293b; padding: 2px 6px; border-radius: 4px; font-family: monospace;">#${orderId.slice(-8)}</code>
            </p>
          </div>

          <!-- Big Magic Button -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${magicLinkUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 700; font-size: 16px; padding: 16px 36px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); text-transform: none;">
              ✓ Confirm Access Granted
            </a>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
              Opens 1-click proof of delivery modal. Pre-filled with your login link.
            </p>
          </div>

          <!-- Security Footnote -->
          <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 12px; color: #64748b; line-height: 1.5;">
            <strong>Why this matters:</strong> Submitting 1-click proof of delivery timestamps your fulfillment and automatically sends credentials to the student, protecting you against dispute claims and unlocking your payout.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(vendorEmail, subject, textBody, htmlBody);
}

/**
 * 3. Platform Sends Final Credentials to Buyer
 * Dispatched when vendor submits the 1-click Proof of Delivery.
 */
export async function sendBuyerCredentialsEmail({
  buyerEmail,
  buyerName,
  courseTitle,
  accessUrl,
  accessNote,
  orderId,
}: {
  buyerEmail: string;
  buyerName: string;
  courseTitle: string;
  accessUrl: string;
  accessNote?: string;
  orderId: string;
}): Promise<EmailDispatchResult> {
  const subject = `Your Course Access Is Ready: ${courseTitle}`;

  const noteText = accessNote ? `\n\nAccess Instructions / Temp Password:\n${accessNote}` : '';

  const textBody = `Hi ${buyerName},

Great news! The creator of ${courseTitle} has granted your access.

Login Portal:
${accessUrl}${noteText}

Your registered email for login: ${buyerEmail}
Order ID: #${orderId.slice(-8)}

If you have any trouble logging in, reply to this email anytime.

Happy learning,
The Agent Croww Team`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Course Access Is Ready</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
            <span style="font-weight: 800; font-size: 18px; color: #ffffff;">Agent Croww</span>
            <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
              ✓ ACCESS GRANTED
            </span>
          </div>

          <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">
            Your course access for <span style="color: #38bdf8;">${courseTitle}</span> is ready!
          </h1>

          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
            Hi <strong style="color: #ffffff;">${buyerName}</strong>, the creator has activated your account. You can now log in and begin learning immediately.
          </p>

          <!-- Access Credentials Box -->
          <div style="background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px;">Login Details</div>
            
            <p style="margin: 6px 0; font-size: 14px; color: #f8fafc;">
              <strong style="color: #94a3b8;">Username / Email:</strong> <span style="color: #ffffff; font-weight: 600;">${buyerEmail}</span>
            </p>

            ${accessNote ? `
            <div style="margin-top: 14px; padding: 12px; background-color: #1e293b; border-radius: 8px; border-left: 3px solid #38bdf8;">
              <div style="font-size: 11px; text-transform: uppercase; color: #38bdf8; font-weight: 700; margin-bottom: 4px;">Creator's Note / Temporary Credentials:</div>
              <div style="font-size: 14px; color: #f1f5f9; line-height: 1.5; white-space: pre-line;">${accessNote}</div>
            </div>` : ''}
          </div>

          <!-- CTA Button to LMS -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${accessUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; font-weight: 700; font-size: 16px; padding: 16px 36px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);">
              🚀 Go to Course Portal →
            </a>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
              Portal URL: <a href="${accessUrl}" style="color: #38bdf8; text-decoration: none;">${accessUrl}</a>
            </p>
          </div>

          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px; margin: 0;">
            Order ID: <code style="font-family: monospace; color: #cbd5e1;">#${orderId.slice(-8)}</code>. If you have any questions or need help, reply directly to this email.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(buyerEmail, subject, textBody, htmlBody);
}

/**
 * 4. Automated 12-Hour SLA Nudge to Vendor
 * Fired by cron job when order stays in PENDING_FULFILLMENT after 12 hours.
 */
export async function sendVendor12HourSlaNudgeEmail({
  vendorEmail,
  buyerName,
  buyerEmail,
  courseTitle,
  orderId,
  hoursElapsed,
  magicLinkUrl,
}: {
  vendorEmail: string;
  buyerName: string;
  buyerEmail: string;
  courseTitle: string;
  orderId: string;
  hoursElapsed: number;
  magicLinkUrl: string;
}): Promise<EmailDispatchResult> {
  const subject = `⚠️ URGENT REMINDER: 12 Hours Left to Fulfill ${courseTitle} (Order #${orderId.slice(-8)})`;

  const textBody = `URGENT SLA REMINDER:

Order #${orderId.slice(-8)} for "${courseTitle}" was placed ${hoursElapsed} hours ago and is still marked as Pending Fulfillment.

Student Details:
- Name: ${buyerName}
- Email: ${buyerEmail}

Agent Croww guarantees buyers receive credentials within 24 hours. Please provision the student's access in your LMS immediately.

Confirm delivery now via 1-click magic link:
${magicLinkUrl}

Thank you,
Agent Croww Operations`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>SLA Reminder</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #0f172a; border: 1px solid #f59e0b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.2);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <span style="font-weight: 800; font-size: 18px; color: #ffffff;">Agent Croww</span>
            <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.2); color: #fbbf24; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(245, 158, 11, 0.4);">
              ⚠️ 12-HOUR SLA NUDGE
            </span>
          </div>

          <h1 style="font-size: 22px; font-weight: 800; color: #fbbf24; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">
            Action Required: ${hoursElapsed} hours elapsed on Order #${orderId.slice(-8)}
          </h1>

          <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6; margin-bottom: 24px;">
            The order for <strong style="color: #ffffff;">${courseTitle}</strong> is still awaiting access confirmation. The 24-hour delivery promise to student <strong style="color: #38bdf8;">${buyerName}</strong> (${buyerEmail}) expires soon.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLinkUrl}" style="display: inline-block; background-color: #f59e0b; color: #020617; font-weight: 800; font-size: 16px; padding: 16px 36px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
              Confirm Access Granted Now →
            </a>
          </div>

          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px; margin: 0;">
            Need help? Reply directly to this email or reach us at <a href="mailto:team@agentcroww.com" style="color: #38bdf8;">team@agentcroww.com</a>.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(vendorEmail, subject, textBody, htmlBody);
}

/**
 * Reusable helper to send email through Resend with simulation fallback
 */
async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<EmailDispatchResult> {
  const resend = getResendClient();
  const fromEmail = getFromEmail();

  if (!resend) {
    console.warn(`[Resend Simulated Email]\nTo: ${to}\nSubject: ${subject}\n${text}`);
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      text,
      html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('[Resend Exception]', err);
    return { success: false, error: err.message || 'Email dispatch failed' };
  }
}

/**
 * Backward compatibility wrapper for notifyVendorOfSale
 */
export async function notifyVendorOfSale(
  vendorEmail: string,
  buyerName: string,
  buyerEmail: string,
  courseName: string,
  orderId: string
): Promise<EmailDispatchResult> {
  const appUrl = getAppUrl();
  const magicLinkUrl = `${appUrl}/vendor/fulfill/${orderId}`;
  return sendVendorOrderAlertEmail({
    vendorEmail,
    buyerName,
    buyerEmail,
    courseTitle: courseName,
    orderId,
    netPayout: 0,
    magicLinkUrl,
  });
}

/**
 * Triggers both Hour 0 emails (Buyer Receipt + Vendor Alert) with fulfillment token & magic link.
 */
export async function triggerHourZeroEmails(orderId: string): Promise<{
  buyerResult: EmailDispatchResult;
  vendorResult: EmailDispatchResult;
}> {
  try {
    const { generateFulfillmentToken } = await import('@/lib/fulfillment-token');

    // 1. Fetch order details
    const { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id, product_id, guest_customer_id, customer_details, final_price, base_price, vendor_payout, fulfillment_token, order_status')
      .or(`id.eq.${orderId},payment_gateway_order_id.eq.${orderId}`)
      .maybeSingle();

    if (!order) {
      console.warn(`[triggerHourZeroEmails] Order not found: ${orderId}`);
      return {
        buyerResult: { success: false, error: 'Order not found' },
        vendorResult: { success: false, error: 'Order not found' },
      };
    }

    // Generate token if not already assigned
    let token = order.fulfillment_token;
    if (!token) {
      token = generateFulfillmentToken(order.id);
      await supabase
        .from('orders')
        .update({
          fulfillment_token: token,
          order_status: order.order_status === 'pending' || order.order_status === 'confirmed' ? 'pending_fulfillment' : order.order_status,
        })
        .eq('id', order.id);
    }

    // 2. Fetch Buyer info
    let buyerName = order.customer_details?.name || 'Learner';
    let buyerEmail = order.customer_details?.email || '';
    let buyerPhone = order.customer_details?.phone || '';

    if (order.guest_customer_id) {
      const { data: guest } = await supabase
        .from('guest_customers')
        .select('name, email, phone')
        .eq('id', order.guest_customer_id)
        .maybeSingle();

      if (guest?.email) buyerEmail = guest.email;
      if (guest?.name) buyerName = guest.name;
      if (guest?.phone) buyerPhone = guest.phone;
    }

    // 3. Fetch Product info
    let courseTitle = 'Your Course';
    if (order.product_id) {
      const { data: prod } = await supabase
        .from('products')
        .select('name')
        .eq('id', order.product_id)
        .maybeSingle();
      if (prod?.name) courseTitle = prod.name;
    }

    // 4. Fetch Vendor info
    let vendorEmail: string | undefined;
    if (order.vendor_id) {
      const { data: vendorRecord } = await supabase
        .from('vendors')
        .select('email')
        .eq('id', order.vendor_id)
        .maybeSingle();
      vendorEmail = vendorRecord?.email;

      if (!vendorEmail) {
        const { data: userRecord } = await supabase
          .from('users')
          .select('email')
          .eq('id', order.vendor_id)
          .maybeSingle();
        vendorEmail = userRecord?.email;
      }
    }

    const appUrl = getAppUrl();
    const magicLinkUrl = `${appUrl}/vendor/fulfill/${order.id}?token=${encodeURIComponent(token)}`;
    const amountPaid = Number(order.final_price || order.base_price || 0);
    const netPayout = Number(order.vendor_payout || amountPaid * 0.8);

    // Send Buyer Receipt
    let buyerResult: EmailDispatchResult = { success: false, error: 'No buyer email' };
    if (buyerEmail) {
      buyerResult = await sendBuyerReceiptEmail({
        buyerEmail,
        buyerName,
        courseTitle,
        orderId: order.id,
        amountPaid,
      });
    }

    // Send Vendor Alert with Magic Link
    let vendorResult: EmailDispatchResult = { success: false, error: 'No vendor email' };
    if (vendorEmail) {
      vendorResult = await sendVendorOrderAlertEmail({
        vendorEmail,
        buyerName,
        buyerEmail,
        buyerPhone,
        courseTitle,
        orderId: order.id,
        netPayout,
        magicLinkUrl,
      });
    }

    return { buyerResult, vendorResult };
  } catch (err: any) {
    console.error('[triggerHourZeroEmails] Error:', err);
    return {
      buyerResult: { success: false, error: err.message },
      vendorResult: { success: false, error: err.message },
    };
  }
}

/**
 * Backward compatibility wrapper
 */
export async function triggerVendorSaleNotification(orderId: string): Promise<EmailDispatchResult> {
  const result = await triggerHourZeroEmails(orderId);
  return result.vendorResult;
}
