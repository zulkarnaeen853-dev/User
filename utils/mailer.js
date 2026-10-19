const nodemailer = require('nodemailer')

function getClientUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')
}

function createTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  })
}

function wrapEmail(title, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #202124;">
      <h2 style="font-weight: 400;">${title}</h2>
      ${bodyHtml}
      <p style="color: #5f6368; font-size: 12px; margin-top: 32px;">If you did not request this, you can ignore this email.</p>
    </div>
  `
}

async function sendMail({ to, subject, html, text, debugUrl }) {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@localhost'

  if (!transporter) {
    console.log(`[mailer] SMTP is not configured. Email to ${to} was skipped.`)
    if (debugUrl) {
      console.log(`[mailer] Use this link instead: ${debugUrl}`)
    }
    return { delivered: false, reason: 'smtp_not_configured' }
  }

  await transporter.sendMail({ from, to, subject, html, text })
  return { delivered: true }
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${getClientUrl()}/verify-email?token=${token}`
  const subject = 'Verify your email address'
  const html = wrapEmail(
    'Confirm your email',
    `<p>Hi ${user.name},</p>
     <p>Thanks for creating an account. Click the button below to verify your email. This link expires in 24 hours.</p>
     <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 18px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:4px;">Verify email</a></p>
     <p>Or copy this link:<br /><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  )

  return sendMail({
    to: user.email,
    subject,
    html,
    text: `Verify your email: ${verifyUrl}`,
    debugUrl: verifyUrl,
  })
}

async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${getClientUrl()}/reset-password?token=${token}`
  const subject = 'Reset your password'
  const html = wrapEmail(
    'Reset your password',
    `<p>Hi ${user.name},</p>
     <p>We received a request to reset your password. This link expires in 15 minutes.</p>
     <p><a href="${resetUrl}" style="display:inline-block;padding:10px 18px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:4px;">Reset password</a></p>
     <p>Or copy this link:<br /><a href="${resetUrl}">${resetUrl}</a></p>`,
  )

  return sendMail({
    to: user.email,
    subject,
    html,
    text: `Reset your password: ${resetUrl}`,
    debugUrl: resetUrl,
  })
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  getClientUrl,
}
