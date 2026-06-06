"""
email_service.py — Real email sender using Gmail SMTP (TLS on port 587).

Uses Python's built-in smtplib + email.mime — no extra packages required.
Credentials are loaded from .env via Settings.
"""

import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from .config import settings

logger = logging.getLogger(__name__)


def _build_invoice_html(invoice, vendor_email: str) -> str:
    """Build a clean, professional HTML invoice email body."""
    from datetime import datetime

    inv_num = invoice.invoice_number
    vendor_label = getattr(invoice, "vendor_name", None) or f"Vendor #{invoice.vendor_id}"
    po_ref = getattr(invoice, "po_number", None) or f"PO #{invoice.po_id}"
    created = invoice.created_at.strftime("%d %B %Y") if invoice.created_at else "—"
    subtotal = f"₹{invoice.subtotal:,.2f}"
    tax_pct = invoice.tax_percent
    tax_amt = f"₹{invoice.tax_amount:,.2f}"
    total = f"₹{invoice.total:,.2f}"

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Invoice {inv_num}</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#181b2a;border:1px solid rgba(139,92,246,0.25);border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4c1d95,#0e7490);padding:32px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:10px;letter-spacing:4px;color:#a5f3fc;text-transform:uppercase;font-weight:600;">Procurement Galaxy ERP</p>
                  <h1 style="margin:8px 0 4px;font-size:26px;font-weight:800;color:#fff;">Tax Invoice</h1>
                  <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">Invoice No: <strong style="color:#67e8f9;">{inv_num}</strong></p>
                </td>
                <td align="right" style="vertical-align:top;">
                  <span style="display:inline-block;padding:6px 16px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:999px;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:2px;">{invoice.status}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Meta info -->
        <tr>
          <td style="padding:24px 36px 0;border-bottom:1px solid rgba(139,92,246,0.15);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:20px;">
                  <p style="margin:0 0 4px;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:2px;">Bill To</p>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#e2e8f0;">{vendor_label}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">{vendor_email}</p>
                </td>
                <td align="right" style="padding-bottom:20px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:2px;text-align:right;">Invoice Date</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;text-align:right;">{created}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;text-align:right;">PO Ref: {po_ref}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Line item table -->
        <tr>
          <td style="padding:24px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <thead>
                <tr style="background:rgba(139,92,246,0.1);">
                  <th style="padding:10px 14px;text-align:left;font-size:10px;color:#8b5cf6;text-transform:uppercase;letter-spacing:2px;font-weight:700;border-radius:6px 0 0 6px;">#</th>
                  <th style="padding:10px 14px;text-align:left;font-size:10px;color:#8b5cf6;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Description</th>
                  <th style="padding:10px 14px;text-align:right;font-size:10px;color:#8b5cf6;text-transform:uppercase;letter-spacing:2px;font-weight:700;border-radius:0 6px 6px 0;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:14px 14px;font-size:13px;color:#cbd5e1;border-bottom:1px solid rgba(139,92,246,0.08);">1</td>
                  <td style="padding:14px 14px;font-size:13px;color:#cbd5e1;border-bottom:1px solid rgba(139,92,246,0.08);">Procurement Services — {po_ref}</td>
                  <td style="padding:14px 14px;font-size:13px;color:#cbd5e1;text-align:right;border-bottom:1px solid rgba(139,92,246,0.08);">{subtotal}</td>
                </tr>
              </tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr>
                <td style="width:55%;"></td>
                <td style="width:45%;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:12px;color:#94a3b8;">Subtotal</td>
                      <td style="padding:6px 0;font-size:12px;color:#cbd5e1;text-align:right;">{subtotal}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:12px;color:#94a3b8;">GST ({tax_pct}%)</td>
                      <td style="padding:6px 0;font-size:12px;color:#fbbf24;text-align:right;">{tax_amt}</td>
                    </tr>
                    <tr style="border-top:1px solid rgba(139,92,246,0.3);">
                      <td style="padding:12px 0 6px;font-size:15px;font-weight:800;color:#e2e8f0;">Total Due</td>
                      <td style="padding:12px 0 6px;font-size:18px;font-weight:800;color:#67e8f9;text-align:right;">{total}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;background:rgba(0,0,0,0.25);border-top:1px solid rgba(139,92,246,0.1);">
            <p style="margin:0;font-size:10px;color:#475569;text-align:center;line-height:1.8;">
              This is an electronically generated invoice from <strong style="color:#7c3aed;">Procurement Galaxy ERP</strong>.<br/>
              For queries, contact us at <a href="mailto:{settings.SMTP_FROM}" style="color:#67e8f9;">{settings.SMTP_FROM}</a><br/>
              GSTIN applicable. Thank you for your business.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def send_invoice_email(invoice, vendor_email: str, vendor_name: str) -> dict:
    """
    Send a real invoice email via Gmail SMTP (TLS port 587).

    Returns: {"success": True/False, "error": str|None}
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return {"success": False, "error": "SMTP credentials not configured"}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Invoice {invoice.invoice_number} from Procurement Galaxy ERP"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
        msg["To"] = vendor_email
        msg["Reply-To"] = settings.SMTP_FROM

        # Plain text fallback
        plain_text = (
            f"Invoice: {invoice.invoice_number}\n"
            f"Vendor: {vendor_name}\n"
            f"Subtotal: ₹{invoice.subtotal:,.2f}\n"
            f"GST ({invoice.tax_percent}%): ₹{invoice.tax_amount:,.2f}\n"
            f"Total: ₹{invoice.total:,.2f}\n"
            f"Status: {invoice.status}\n\n"
            f"This invoice was sent from Procurement Galaxy ERP.\n"
            f"Contact: {settings.SMTP_FROM}"
        )

        html_body = _build_invoice_html(invoice, vendor_email)

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        # Open SMTP connection with TLS
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, [vendor_email], msg.as_string())

        logger.info(f"Invoice email sent: {invoice.invoice_number} → {vendor_email}")
        return {"success": True, "error": None}

    except smtplib.SMTPAuthenticationError:
        err = "Gmail authentication failed. Check your App Password in .env"
        logger.error(err)
        return {"success": False, "error": err}
    except smtplib.SMTPRecipientsRefused:
        err = f"Recipient refused: {vendor_email}"
        logger.error(err)
        return {"success": False, "error": err}
    except smtplib.SMTPException as e:
        err = f"SMTP error: {str(e)}"
        logger.error(err)
        return {"success": False, "error": err}
    except Exception as e:
        err = f"Unexpected error sending email: {str(e)}"
        logger.error(err)
        return {"success": False, "error": err}


def send_forgot_password_email(to_email: str, username: str, otp: str) -> dict:
    """
    Send a real password reset OTP email.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return {"success": False, "error": "SMTP credentials not configured"}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🔐 Security Code — Procurement Galaxy ERP"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
        msg["To"] = to_email

        plain = (
            f"Hi {username},\n\n"
            f"Your Procurement Galaxy security recovery code is: {otp}\n\n"
            f"This code is valid for one use only.\n"
            f"If you didn't request this, ignore this email.\n\n"
            f"— Procurement Galaxy ERP"
        )

        html = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table width="520" cellpadding="0" cellspacing="0" style="background:#181b2a;border:1px solid rgba(139,92,246,0.25);border-radius:16px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#4c1d95,#0e7490);padding:28px 32px;">
      <p style="margin:0;font-size:10px;letter-spacing:4px;color:#a5f3fc;text-transform:uppercase;">Procurement Galaxy ERP</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;">Security Recovery Code</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;">Hi <strong style="color:#e2e8f0;">{username}</strong>,</p>
      <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">Use the code below to reset your Procurement Galaxy security code:</p>
      <div style="text-align:center;padding:20px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;margin:0 0 24px;">
        <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#67e8f9;font-family:monospace;">{otp}</span>
      </div>
      <p style="margin:0;font-size:12px;color:#475569;">This code is for one-time use only. If you didn't request this, please ignore this email.</p>
    </td></tr>
    <tr><td style="padding:16px 32px;background:rgba(0,0,0,0.2);border-top:1px solid rgba(139,92,246,0.1);">
      <p style="margin:0;font-size:10px;color:#475569;text-align:center;">Procurement Galaxy ERP — Authorized Electronic Document</p>
    </td></tr>
  </table>
  </td></tr></table>
</body>
</html>
"""
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())

        logger.info(f"Password reset email sent to {to_email}")
        return {"success": True, "error": None}

    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        return {"success": False, "error": str(e)}
