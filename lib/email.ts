/**
 * Email service using Resend API directly
 * This avoids the heavy resend package (which includes svix at 4.4MB)
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "MiniOrg <noreply@donotreply.aher.vet>";

interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email via Resend API
 */
async function sendEmail(options: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}

/**
 * Generate styled email HTML template
 */
function emailTemplate(
  title: string,
  content: string,
  code: string
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #eaeaea;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1a1a1a;">MiniOrg</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #333333;">Bonjour,</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #333333;">${content}</p>

              <!-- Code Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <div style="display: inline-block; background-color: #E17C4F; border-radius: 8px; padding: 16px 32px;">
                      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #ffffff; font-family: monospace;">${code}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.5; color: #666666;">Ce code expire dans 15 minutes.</p>
              <p style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.5; color: #666666;">Si vous n'avez pas demandé ceci, ignorez cet email.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #eaeaea; background-color: #fafafa; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; font-size: 12px; color: #999999;">&copy; MiniOrg</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send verification email with 6-digit code
 */
export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  const html = emailTemplate(
    "Votre code de vérification - MiniOrg",
    "Voici votre code de vérification pour créer votre compte MiniOrg :",
    code
  );

  await sendEmail({
    from: FROM_EMAIL,
    to: email,
    subject: "Votre code de vérification - MiniOrg",
    html,
  });
}

/**
 * Send password reset email with 6-digit code
 */
export async function sendPasswordResetEmail(
  email: string,
  code: string
): Promise<void> {
  const html = emailTemplate(
    "Votre code de réinitialisation - MiniOrg",
    "Voici votre code pour réinitialiser votre mot de passe MiniOrg :",
    code
  );

  await sendEmail({
    from: FROM_EMAIL,
    to: email,
    subject: "Votre code de réinitialisation - MiniOrg",
    html,
  });
}
