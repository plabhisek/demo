import smtplib
from email.message import EmailMessage

# SMTP Configuration
EMAIL_HOST = '195.1.107.96'
EMAIL_PORT = 25
EMAIL_SECURE = False  # No TLS/SSL
EMAIL_USER = ''       # No login user
EMAIL_PASSWORD = ''   # No login password
EMAIL_FROM = 'meetings@vedanta.co.in'
EMAIL_TO = 'abhisek.paul@vedanta.co.in'  # Corrected email format

# Compose the email
msg = EmailMessage()
msg['Subject'] = 'Test Email from Python'
msg['From'] = EMAIL_FROM
msg['To'] = EMAIL_TO
msg.set_content('This is a test email sent using Python with the provided SMTP configuration.')

try:
    # Connect to SMTP server
    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
        if EMAIL_SECURE:
            server.starttls()
        if EMAIL_USER and EMAIL_PASSWORD:
            server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
    print('Email sent successfully.')
except Exception as e:
    print(f'Failed to send email: {e}')
