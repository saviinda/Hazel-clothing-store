interface SendEmailParams {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export class EmailService {
  private static apiKey = process.env.BREVO_API_KEY || '';
  private static senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@hazelclothing.lk';
  private static senderName = process.env.BREVO_SENDER_NAME || 'Hazel Clothing';
  private static adminEmail = process.env.BREVO_ADMIN_EMAIL || 'hazeladmin@hazelclothing.lk';

  private static async send({ toEmail, toName, subject, htmlContent }: SendEmailParams): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('BREVO_API_KEY is not defined. Email dispatch skipped.');
      return false;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: this.senderName, email: this.senderEmail },
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
    return this.send({ toEmail: this.adminEmail, toName: 'Hazel Admin', subject, htmlContent: html });
  }
}
