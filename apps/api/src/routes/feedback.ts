import { Router } from 'express';
import { containers } from '../services/cosmos';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export const feedbackRouter = Router();

const CATEGORY_LABELS: Record<string, string> = {
  feature: 'Neue Idee / Wunsch',
  bug: 'Fehler melden',
  design: 'Gestaltung & Bedienung',
  recipe: 'Rezepte & Ernährung',
  styling: 'Stilberatung',
  general: 'Allgemeines',
};

const RATING_LABELS: Record<number, string> = {
  5: '😍 Liebe es!',
  4: '😊 Sehr gut',
  3: '🙂 Geht so',
  2: '😕 Könnte besser sein',
  1: '😞 Nicht gut',
};

async function sendFeedbackEmail(feedback: {
  category: string;
  rating: number;
  message: string;
  userName: string;
  userEmail: string;
  submittedAt: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const notifyEmail = process.env.FEEDBACK_NOTIFY_EMAIL || 'franziska.ulrich@niceneasy.ch';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('SMTP not configured — feedback saved to DB only');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const categoryLabel = CATEGORY_LABELS[feedback.category] || feedback.category;
  const ratingLabel = RATING_LABELS[feedback.rating] || `${feedback.rating}/5`;

  await transporter.sendMail({
    from: `"SpicyHealth Feedback" <${smtpUser}>`,
    to: notifyEmail,
    subject: `💬 Neue Rückmeldung: ${categoryLabel}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fdf8f4; padding: 32px; border-radius: 12px;">
        <h1 style="color: #8B4A6B; font-size: 24px; margin-bottom: 4px;">💬 Neue Rückmeldung</h1>
        <p style="color: #888; font-size: 14px; margin-top: 0;">${new Date(feedback.submittedAt).toLocaleString('de-CH')}</p>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr>
            <td style="padding: 10px 0; color: #666; width: 140px; vertical-align: top; font-size: 14px;">Von</td>
            <td style="padding: 10px 0; color: #333; font-size: 14px;"><strong>${feedback.userName}</strong> (${feedback.userEmail})</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666; vertical-align: top; font-size: 14px;">Kategorie</td>
            <td style="padding: 10px 0; color: #333; font-size: 14px;">${categoryLabel}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666; vertical-align: top; font-size: 14px;">Bewertung</td>
            <td style="padding: 10px 0; color: #333; font-size: 14px;">${ratingLabel}</td>
          </tr>
        </table>

        <div style="background: white; border-left: 4px solid #C4956A; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${feedback.message}</p>
        </div>

        <p style="color: #aaa; font-size: 12px; margin-top: 32px;">SpicyHealth — Testphase</p>
      </div>
    `,
  });
}

feedbackRouter.post('/', async (req: any, res) => {
  const { category = 'general', rating = 0, message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Nachricht fehlt' });
  }

  const entry = {
    id: uuidv4(),
    userId: req.user.userId,
    userEmail: req.user.email,
    userName: req.user.name || req.user.email,
    category,
    rating: Number(rating),
    message: message.trim(),
    submittedAt: new Date().toISOString(),
  };

  await containers.feedback.items.create(entry);

  // Send email notification (non-blocking — failure doesn't affect response)
  sendFeedbackEmail(entry).catch(err => console.error('Feedback email failed:', err));

  res.json({ success: true });
});
