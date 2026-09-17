import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  /**
   * Get or initialize Nodemailer transporter for Gmail / SMTP
   */
  private static getTransporter(): Transporter {
    if (!this.transporter) {
      if (config.email.provider === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.email.smtpUser,
            pass: config.email.smtpPass,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: config.email.smtpHost,
          port: config.email.smtpPort,
          secure: config.email.smtpSecure,
          auth: {
            user: config.email.smtpUser,
            pass: config.email.smtpPass,
          },
        });
      }
    }
    return this.transporter;
  }

  /**
   * Main dispatch method for sending email (Gmail SMTP, Custom SMTP, or Resend API)
   */
  public static async sendEmail(payload: SendEmailPayload): Promise<EmailSendResult> {
    const { to, subject, html, text } = payload;
    const from = payload.from || config.email.from;

    if (!config.email.isConfigured) {
      logger.info(
        `[EmailService: Simulated] Email to: ${to} | Subject: "${subject}" | (Configure GMAIL_USER & GMAIL_APP_PASSWORD in .env for live inbox delivery)`
      );
      return {
        success: true,
        simulated: true,
        messageId: `simulated-${Date.now()}`,
      };
    }

    try {
      if (config.email.provider === 'gmail' || config.email.provider === 'smtp') {
        return await this.sendViaNodemailer({ to, from, subject, html, text });
      } else {
        return await this.sendViaResend({ to, from, subject, html, text });
      }
    } catch (err: any) {
      logger.error(`[EmailService] Failed to send email to ${to}:`, err);
      return {
        success: false,
        error: err?.message || 'Unknown email transmission error',
      };
    }
  }

  /**
   * Dispatch via Nodemailer (Gmail App Password or SMTP)
   */
  private static async sendViaNodemailer(params: {
    to: string;
    from: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<EmailSendResult> {
    const transporter = this.getTransporter();
    const info = await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    logger.info(`[EmailService: Gmail/SMTP] Email sent successfully to ${params.to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  }

  /**
   * Dispatch via Resend API (https://resend.com)
   */
  private static async sendViaResend(params: {
    to: string;
    from: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<EmailSendResult> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.email.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data?.message || `HTTP ${response.status}: ${response.statusText}`;
      logger.warn(`[EmailService: Resend Error] ${errMsg}`);
      return { success: false, error: errMsg };
    }

    logger.info(`[EmailService: Resend] Email sent successfully to ${params.to} (ID: ${data.id})`);
    return { success: true, messageId: data.id };
  }

  /**
   * Send Instructor Approval Email
   */
  public static async sendInstructorApprovalEmail(params: {
    to: string;
    fullName: string;
  }): Promise<EmailSendResult> {
    const { to, fullName } = params;
    const studioUrl = `${config.frontendUrl}/instructor`;

    const subject = '🎉 Welcome to EduSphere! Your Instructor Application has been Approved';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Approved</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      color: #f8fafc;
    }
    .wrapper {
      max-width: 600px;
      margin: 30px auto;
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      color: #e0e7ff;
      font-size: 15px;
    }
    .content {
      padding: 35px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 20px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 20px;
    }
    .card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
    }
    .card-title {
      font-weight: 700;
      color: #f1f5f9;
      font-size: 14px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card ul {
      margin: 0;
      padding-left: 20px;
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.8;
    }
    .btn-container {
      text-align: center;
      margin: 35px 0 25px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      font-size: 16px;
      font-weight: 700;
      border-radius: 10px;
      box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
    }
    .footer {
      background: #0f172a;
      padding: 25px 30px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>EduSphere LMS</h1>
      <p>Empowering the Next Generation of Learners & Creators</p>
    </div>
    <div class="content">
      <div class="badge">✓ APPLICATION APPROVED</div>
      <div class="greeting">Hello ${fullName || 'Instructor'},</div>
      <p class="paragraph">
        Great news! The administration team has reviewed your application and verified your educator credentials. 
        Your <strong>Instructor Account is now fully active</strong>.
      </p>

      <div class="card">
        <div class="card-title">What you can do next:</div>
        <ul>
          <li>Create & publish new video & lecture courses</li>
          <li>Build modular curriculum sections with quizzes & assignments</li>
          <li>Engage directly with enrolled students via discussion forums</li>
          <li>Monitor your analytics, enrollments, and payout earnings</li>
        </ul>
      </div>

      <div class="btn-container">
        <a href="${studioUrl}" class="btn">Open Instructor Studio →</a>
      </div>

      <p class="paragraph" style="font-size: 13px; color: #94a3b8; text-align: center;">
        Direct Studio URL: <a href="${studioUrl}" style="color: #818cf8;">${studioUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EduSphere Learning Management Platform. All rights reserved.</p>
      <p>Need assistance? Contact our team at <a href="mailto:support@edusphere.edu">support@edusphere.edu</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `Hello ${fullName || 'Instructor'},\n\n` +
      `Great news! Your instructor application on EduSphere LMS has been approved.\n` +
      `Your account is now active, and you have full access to create courses, upload lessons, create quizzes, and manage students.\n\n` +
      `Access your Instructor Studio here: ${studioUrl}\n\n` +
      `EduSphere LMS Team`;

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send Instructor Rejection / Status Update Email
   */
  public static async sendInstructorRejectionEmail(params: {
    to: string;
    fullName: string;
    reason?: string;
  }): Promise<EmailSendResult> {
    const { to, fullName, reason } = params;
    const supportEmail = 'support@edusphere.edu';

    const subject = 'Update Regarding Your EduSphere Instructor Application';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Status Update</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    .header { background: #334155; padding: 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; }
    .content { padding: 30px; }
    .reason-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px; margin: 20px 0; color: #fca5a5; font-size: 14px; }
    .footer { background: #0f172a; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>EduSphere LMS - Application Update</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName || 'Instructor'},</p>
      <p>Thank you for your interest in joining the EduSphere instructor community. After reviewing your submission, our team is unable to approve your application at this time.</p>
      ${
        reason
          ? `<div class="reason-box"><strong>Reviewer Feedback:</strong><br/>${reason}</div>`
          : ''
      }
      <p>If you believe this decision was in error or if you have updated qualifications, feel free to reply or contact our support team at <a href="mailto:${supportEmail}" style="color: #818cf8;">${supportEmail}</a>.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EduSphere LMS.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `Hello ${fullName || 'Instructor'},\n\n` +
      `Thank you for your interest in teaching on EduSphere LMS. After reviewing your application, our team is unable to approve it at this time.\n` +
      (reason ? `Feedback: ${reason}\n\n` : '\n') +
      `If you have questions, please reach out to ${supportEmail}.\n\n` +
      `EduSphere LMS Team`;

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send Course Approved & Published Email to Instructor
   */
  public static async sendCourseApprovalEmail(params: {
    to: string;
    instructorName: string;
    courseTitle: string;
    courseId?: string;
  }): Promise<EmailSendResult> {
    const { to, instructorName, courseTitle, courseId } = params;
    const studioUrl = `${config.frontendUrl}/instructor/courses`;
    const catalogUrl = courseId ? `${config.frontendUrl}/courses/${courseId}` : `${config.frontendUrl}/courses`;

    const subject = `🎉 Course Published: "${courseTitle}" has been approved!`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Course Approved</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #f8fafc; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 35px 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; }
    .header p { margin: 8px 0 0 0; color: #d1fae5; font-size: 14px; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 14px; }
    .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-bottom: 20px; border: 1px solid rgba(16, 185, 129, 0.3); }
    .course-card { background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .course-title { font-size: 17px; font-weight: 700; color: #60a5fa; margin-bottom: 8px; }
    .paragraph { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 16px; }
    .btn-container { text-align: center; margin: 30px 0 20px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; padding: 13px 32px; font-size: 15px; font-weight: 700; border-radius: 10px; }
    .footer { background: #0f172a; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    .footer a { color: #818cf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>EduSphere LMS</h1>
      <p>Course Publication Confirmation</p>
    </div>
    <div class="content">
      <div class="badge">✓ COURSE APPROVED & PUBLISHED</div>
      <div class="greeting">Hello ${instructorName || 'Instructor'},</div>
      <p class="paragraph">
        Congratulations! Your course submission has been reviewed and approved by the EduSphere administration team.
      </p>

      <div class="course-card">
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Live Course</div>
        <div class="course-title">"${courseTitle}"</div>
        <div style="font-size: 13px; color: #34d399; font-weight: 600;">Status: Published & Open for Enrollments</div>
      </div>

      <p class="paragraph">
        Your course is now visible in the public course catalog at <a href="${catalogUrl}" style="color: #818cf8;">${catalogUrl}</a>, and students can enroll and start learning.
      </p>

      <div class="btn-container">
        <a href="${studioUrl}" class="btn">Manage in Instructor Studio →</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EduSphere Learning Management Platform.</p>
      <p>Questions? Reach out to <a href="mailto:support@edusphere.edu">support@edusphere.edu</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `Hello ${instructorName || 'Instructor'},\n\n` +
      `Great news! Your course "${courseTitle}" has been approved and published to the EduSphere LMS catalog.\n` +
      `Students can now enroll and start learning.\n\n` +
      `Catalog Link: ${catalogUrl}\n` +
      `Studio Link: ${studioUrl}\n\n` +
      `EduSphere LMS Team`;

    return this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send Course Rejection Email to Instructor
   */
  public static async sendCourseRejectionEmail(params: {
    to: string;
    instructorName: string;
    courseTitle: string;
    reason?: string;
    courseId?: string;
  }): Promise<EmailSendResult> {
    const { to, instructorName, courseTitle, reason } = params;
    const studioUrl = `${config.frontendUrl}/instructor/courses`;
    const supportEmail = 'support@edusphere.edu';

    const subject = `Action Required: Feedback on your course submission "${courseTitle}"`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Course Feedback</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    .header { background: #334155; padding: 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; }
    .content { padding: 30px; }
    .reason-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px; margin: 20px 0; color: #fca5a5; font-size: 14px; }
    .footer { background: #0f172a; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>EduSphere LMS - Course Review</h1>
    </div>
    <div class="content">
      <p>Hello ${instructorName || 'Instructor'},</p>
      <p>Thank you for submitting <strong>"${courseTitle}"</strong> for review. Our curriculum review team has evaluated your submission and found a few items that need adjustments before it can be published.</p>
      ${
        reason
          ? `<div class="reason-box"><strong>Reviewer Feedback:</strong><br/>${reason}</div>`
          : ''
      }
      <p>You can update your course content, lessons, or resources according to the feedback and re-submit it for review anytime from your studio.</p>
      <p>Questions? Contact our team at <a href="mailto:${supportEmail}" style="color: #818cf8;">${supportEmail}</a>.</p>
      <p><a href="${studioUrl}" style="color: #818cf8; font-weight: 600;">Open Course Studio →</a></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EduSphere LMS.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `Hello ${instructorName || 'Instructor'},\n\n` +
      `Your course "${courseTitle}" was reviewed and requires adjustments before publication.\n` +
      (reason ? `Feedback: ${reason}\n\n` : '\n') +
      `You can update and re-submit from your studio: ${studioUrl}\n` +
      `Support: ${supportEmail}\n\n` +
      `EduSphere LMS Team`;

    return this.sendEmail({ to, subject, html, text });
  }
}

