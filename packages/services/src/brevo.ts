interface SendEmailParams {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export class EmailService {
  private static getApiKey() { return process.env.BREVO_API_KEY || ''; }
  private static getSenderEmail() { return process.env.BREVO_SENDER_EMAIL || 'noreply@hazelclothing.lk'; }
  private static getSenderName() { return process.env.BREVO_SENDER_NAME || 'Hazel Clothing'; }
  private static getAdminEmail() { return process.env.BREVO_ADMIN_EMAIL || 'hazeladmin@hazelclothing.lk'; }

  private static async send({ toEmail, toName, subject, htmlContent }: SendEmailParams): Promise<boolean> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('BREVO_API_KEY is not defined. Email dispatch skipped.');
      return false;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: this.getSenderName(), email: this.getSenderEmail() },
          to: [{ email: toEmail, name: toName }],
          subject: subject,
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Brevo email sending failed: ${response.status} - ${errText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Brevo API network error:', error);
      return false;
    }
  }

  // 1. Send Order Confirmation to Customer
  static async sendOrderConfirmation(customerEmail: string, customerName: string, orderId: string, totalAmount: number): Promise<boolean> {
    const subject = `Order Confirmed! - Hazel Clothing (#${orderId.slice(0, 8)})`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #d4a373;">Thank you for your order, ${customerName}!</h2>
        <p>We have successfully received your order <strong>#${orderId}</strong>.</p>
        <p><strong>Total Amount:</strong> LKR ${totalAmount.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> Bank Transfer</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="background: #fdfaf6; padding: 15px; border-left: 4px solid #d4a373;">
          <strong>Next Steps:</strong> Please perform a bank transfer to our official account and upload your payment receipt screenshot on the tracking page to start verification.
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">Hazel Clothing, Sri Lanka</p>
      </div>
    `;
    return this.send({ toEmail: customerEmail, toName: customerName, subject, htmlContent: html });
  }

  // 2. Send Payment Verified / Rejected Email
  static async sendPaymentVerificationResult(customerEmail: string, customerName: string, orderId: string, approved: boolean, reason?: string): Promise<boolean> {
    const statusText = approved ? 'Verified' : 'Rejected';
    const subject = `Order Payment ${statusText} - Hazel Clothing (#${orderId.slice(0, 8)})`;
    
    let html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: ${approved ? '#2d6a4f' : '#b7094c'};">Payment for Order #${orderId.slice(0, 8)} ${statusText}!</h2>
        <p>Hi ${customerName},</p>
    `;

    if (approved) {
      html += `
        <p>Your bank transfer payment receipt has been successfully verified by our team. Your order is now being processed and packed!</p>
        <p>We will email you the tracking details as soon as the package is dispatched.</p>
      `;
    } else {
      html += `
        <p>Unfortunately, we were unable to verify your bank transfer payment receipt.</p>
        <p><strong>Reason:</strong> ${reason || 'Invalid receipt details or transfer amount mismatch.'}</p>
        <p style="background: #fff0f3; padding: 15px; border-left: 4px solid #b7094c;">
          Please go back to your order tracking page, review our bank details, and upload a valid receipt image.
        </p>
      `;
    }

    html += `
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; margin-top: 30px;">Hazel Clothing, Sri Lanka</p>
      </div>
    `;

    return this.send({ toEmail: customerEmail, toName: customerName, subject, htmlContent: html });
  }

  // 3. Send Shipping Update Email
  static async sendShippingUpdate(customerEmail: string, customerName: string, orderId: string, courier: string, trackingNumber: string): Promise<boolean> {
    const subject = `Your order is on the way! - Hazel Clothing (#${orderId.slice(0, 8)})`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #d4a373;">Your order has been shipped!</h2>
        <p>Hi ${customerName}, your package for order <strong>#${orderId.slice(0, 8)}</strong> is on its way to you.</p>
        <div style="background: #fdfaf6; padding: 15px; margin: 20px 0; border: 1px solid #f5ebe0;">
          <p><strong>Courier:</strong> ${courier}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        </div>
        <p>Please allow 1-3 business days for deliveries within Sri Lanka.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; margin-top: 30px;">Hazel Clothing, Sri Lanka</p>
      </div>
    `;
    return this.send({ toEmail: customerEmail, toName: customerName, subject, htmlContent: html });
  }

  // 5. Send Contact Form Message to Owner + Auto-reply to Customer
  static async sendContactMessage(params: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    subject: string;
    message: string;
    ownerEmail: string;
  }): Promise<boolean> {
    const { customerName, customerEmail, customerPhone, subject, message, ownerEmail } = params;

    // Email to owner
    const ownerHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px;">
        <div style="background: #2d2d2d; padding: 20px 24px; border-radius: 6px 6px 0 0;">
          <h2 style="color: #d4a373; margin: 0; font-size: 20px;">📩 New Contact Message</h2>
          <p style="color: #aaa; margin: 4px 0 0; font-size: 13px;">Via Hazel Clothing website contact form</p>
        </div>
        <div style="background: #fdfaf6; padding: 24px; border: 1px solid #f5ebe0; border-top: none;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #888; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: bold;">${customerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;"><a href="mailto:${customerEmail}" style="color: #d4a373;">${customerEmail}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Phone</td><td style="padding: 8px 0;">${customerPhone || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Subject</td><td style="padding: 8px 0;">${subject || 'Website Enquiry'}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="color: #555; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
        </div>
        <div style="background: #f5ebe0; padding: 12px 24px; border-radius: 0 0 6px 6px; font-size: 11px; color: #aaa;">
          Hazel Clothing Boutique · Sri Lanka
        </div>
      </div>
    `;

    // Auto-reply to customer
    const customerHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px;">
        <div style="background: #2d2d2d; padding: 20px 24px; border-radius: 6px 6px 0 0;">
          <h2 style="color: #d4a373; margin: 0; font-size: 20px;">We received your message! 💌</h2>
        </div>
        <div style="background: #fdfaf6; padding: 24px; border: 1px solid #f5ebe0; border-top: none;">
          <p style="font-size: 15px;">Hi <strong>${customerName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.7; color: #555;">
            Thank you for reaching out to Hazel Clothing! We have received your message and our team will get back to you as soon as possible — usually within a few hours during business hours (Mon–Sat, 9 AM–6 PM).
          </p>
          <div style="background: #fff; border: 1px solid #f5ebe0; border-left: 4px solid #d4a373; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #888;">Your message:</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #333; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="font-size: 14px; color: #555;">
            For urgent enquiries, you can also reach us on <strong>WhatsApp</strong> — the link is on our contact page.
          </p>
        </div>
        <div style="background: #f5ebe0; padding: 12px 24px; border-radius: 0 0 6px 6px; font-size: 11px; color: #aaa;">
          Hazel Clothing Boutique · Sri Lanka
        </div>
      </div>
    `;

    const [ownerSent, customerSent] = await Promise.all([
      this.send({
        toEmail: ownerEmail,
        toName: 'Hazel Clothing',
        subject: `📩 Contact: ${subject || 'Website Enquiry'} — from ${customerName}`,
        htmlContent: ownerHtml,
      }),
      this.send({
        toEmail: customerEmail,
        toName: customerName,
        subject: `We received your message — Hazel Clothing`,
        htmlContent: customerHtml,
      }),
    ]);

    return ownerSent || customerSent;
  }

  // 4. Send New Order Alert to Admin
  static async sendNewOrderAlertToAdmin(orderId: string, totalAmount: number): Promise<boolean> {
    const subject = `🚨 ALERT: New Order Placed (#${orderId.slice(0, 8)})`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #e63946;">New Order Received</h2>
        <p>A new order <strong>#${orderId}</strong> has been placed on the storefront.</p>
        <p><strong>Order Total:</strong> LKR ${totalAmount.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> Bank Transfer</p>
        <p>Please log in to the Hazel Clothing Admin Panel to view details and verify the payment proof when uploaded.</p>
        <a href="${process.env.ADMIN_URL || 'http://localhost:3001'}/orders/${orderId}" 
           style="display: inline-block; background: #d4a373; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px;">
           View Order in Admin
        </a>
      </div>
    `;
    return this.send({ toEmail: this.getAdminEmail(), toName: 'Hazel Admin', subject, htmlContent: html });
  }
}
