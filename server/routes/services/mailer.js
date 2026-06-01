const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

function buildEmailHtml(guestName, selections) {
  const totalPrice = selections.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const totalItems = selections.reduce((sum, s) => sum + s.quantity, 0);

  const rows = selections
    .map(
      (s) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${s.gift_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${s.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${s.price} ₽</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${s.price * s.quantity} ₽</td>
    </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    h2 { color: #6366f1; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
  <h2>Список подарков гостя: ${guestName}</h2>
  <table>
    <thead>
      <tr style="background: #f3f4f6;">
        <th style="padding: 8px; text-align: left;">Подарок</th>
        <th style="padding: 8px; text-align: center;">Кол-во</th>
        <th style="padding: 8px; text-align: right;">Цена</th>
        <th style="padding: 8px; text-align: right;">Сумма</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr style="font-weight: bold; background: #f9fafb;">
        <td style="padding: 8px;">Итого</td>
        <td style="padding: 8px; text-align: center;">${totalItems}</td>
        <td style="padding: 8px;"></td>
        <td style="padding: 8px; text-align: right;">${totalPrice} ₽</td>
      </tr>
    </tfoot>
  </table>
  <p style="color: #888; margin-top: 20px;">Это письмо отправлено автоматически из Birthday Wishlist.</p>
</body>
</html>`;
}

async function sendEmail(guestName, guestEmail, selections) {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error('Email configuration is missing. Check .env file.');
  }

  const html = buildEmailHtml(guestName, selections);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: guestEmail,
    subject: `Список подарков — ${guestName}`,
    html
  });
}

module.exports = { sendEmail };
