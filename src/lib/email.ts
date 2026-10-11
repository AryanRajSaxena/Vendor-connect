import { Resend } from 'resend';

export interface VendorNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Notifies the course creator/vendor immediately when a customer purchases their course.
 * Instructs the vendor to provision account access within the 24-hour SLA promised to the buyer.
 */
export async function notifyVendorOfSale(
  vendorEmail: string,
  buyerName: string,
  buyerEmail: string,
  courseName: string,
  orderId: string
): Promise<VendorNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Agent Croww <orders@agentcroww.com>';

  const subject = '🚨 ACTION REQUIRED: New Sale on Agent Croww - Fulfill within 24 hours!';

  const textBody = `Great news! You just made a sale for ${courseName}.

Here are the buyer's details:
- Name: ${buyerName}
- Email: ${buyerEmail}
- Order ID: ${orderId}

Next Steps:
Please manually create an account for this user on your course platform and email them their login credentials. We have promised the buyer they will receive access within 24 hours.

If you have any issues, please reply to this email.`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Action Required: New Sale</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Tag -->
          <div style="margin-bottom: 20px;">
            <span style="display: inline-block; background-color: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;">
              🚨 24-Hour SLA Fulfillment
            </span>
          </div>

          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; line-height: 1.3;">
            Great news! You just made a sale for <span style="color: #0284c7;">${courseName}</span>.
          </h2>

          <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
            Here are the buyer's details:
          </p>

          <!-- Buyer Details Card -->
          <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
            <p style="margin: 6px 0; font-size: 14px; color: #1e293b;">
              <strong style="color: #475569;">Name:</strong> ${buyerName}
            </p>
            <p style="margin: 6px 0; font-size: 14px; color: #1e293b;">
              <strong style="color: #475569;">Email:</strong> <a href="mailto:${buyerEmail}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${buyerEmail}</a>
            </p>
            <p style="margin: 6px 0; font-size: 14px; color: #1e293b;">
              <strong style="color: #475569;">Order ID:</strong> <code style="background-color: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 13px; font-weight: 600; color: #0f172a;">${orderId}</code>
            </p>
          </div>

          <!-- Next Steps Action Box -->
          <div style="border-left: 4px solid #0284c7; padding-left: 16px; margin-bottom: 24px;">
            <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
              Next Steps:
            </h3>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
              Please manually create an account for this user on your course platform and email them their login credentials. We have promised the buyer they will receive access within <strong>24 hours</strong>.
            </p>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; line-height: 1.5;">
            If you have any issues, please reply to this email or contact support at <a href="mailto:team@agentcroww.com" style="color: #0284c7;">team@agentcroww.com</a>.
          </p>
        </div>
      </body>
    </html>
  `;

  if (!apiKey) {
    console.warn(`[notifyVendorOfSale] RESEND_API_KEY environment variable is not set. Simulated email to: ${vendorEmail}`);
    console.log(`[notifyVendorOfSale Preview]:\nTo: ${vendorEmail}\nSubject: ${subject}\n${textBody}`);
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [vendorEmail],
      subject,
      text: textBody,
      html: htmlBody,
    });

    if (error) {
      console.error('[notifyVendorOfSale] Resend API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send vendor notification email',
      };
    }

    console.log(`[notifyVendorOfSale] Notification email sent successfully to ${vendorEmail} (ID: ${data?.id})`);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: any) {
    console.error('[notifyVendorOfSale] Unexpected exception sending email:', err);
    return {
      success: false,
      error: err.message || 'Unknown error occurred while sending email',
    };
  }
}

/**
 * Automatically loads the order, resolves customer info from guest_customers table,
 * fetches vendor email and course name, and dispatches notifyVendorOfSale.
 */
export async function triggerVendorSaleNotification(orderId: string): Promise<VendorNotificationResult> {
  try {
    const { supabase } = await import('@/lib/supabase');

    // 1. Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, vendor_id, product_id, guest_customer_id, customer_details, payment_status')
      .or(`id.eq.${orderId},payment_gateway_order_id.eq.${orderId}`)
      .maybeSingle();

    if (orderErr || !order) {
      console.warn(`[triggerVendorSaleNotification] Order not found for ID: ${orderId}`);
      return { success: false, error: 'Order not found' };
    }

    // 2. Fetch vendor email
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

    if (!vendorEmail) {
      console.warn(`[triggerVendorSaleNotification] Vendor email not found for vendor_id: ${order.vendor_id}`);
      return { success: false, error: 'Vendor email not found' };
    }

    // 3. Fetch buyer details from guest_customers table (with customer_details fallback)
    let buyerName = order.customer_details?.name || 'Learner';
    let buyerEmail = order.customer_details?.email || '';

    if (order.guest_customer_id) {
      const { data: guestRow } = await supabase
        .from('guest_customers')
        .select('name, email')
        .eq('id', order.guest_customer_id)
        .maybeSingle();

      if (guestRow?.email) buyerEmail = guestRow.email;
      if (guestRow?.name) buyerName = guestRow.name;
    }

    if (!buyerEmail) {
      console.warn(`[triggerVendorSaleNotification] Buyer email missing for order: ${orderId}`);
      return { success: false, error: 'Buyer email missing' };
    }

    // 4. Fetch course name
    let courseName = 'Your Course';
    if (order.product_id) {
      const { data: prod } = await supabase
        .from('products')
        .select('name')
        .eq('id', order.product_id)
        .maybeSingle();
      if (prod?.name) courseName = prod.name;
    }

    return await notifyVendorOfSale(vendorEmail, buyerName, buyerEmail, courseName, order.id);
  } catch (err: any) {
    console.error('[triggerVendorSaleNotification] Failed to trigger notification:', err);
    return { success: false, error: err.message };
  }
}
