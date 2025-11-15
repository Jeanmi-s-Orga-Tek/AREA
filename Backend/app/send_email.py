import os
import smtplib
import ssl

SMTP_SERVER = str(os.environ.get("SMTP_SERVER"))
smtp_port_str = os.environ.get("SMTP_PORT")
if smtp_port_str is None:
    raise ValueError("SMTP_PORT environment variable is not set")
SMTP_PORT = int(smtp_port_str)
EMAIL_USERNAME = str(os.environ.get("EMAIL_USERNAME"))
EMAIL_PASSWORD = str(os.environ.get("EMAIL_PASSWORD"))

def send_email(subject: str, to_email: str, content: str):
    ssl_context = ssl.create_default_context()
    server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=ssl_context)
    server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
    content = 'Subject: {}\n\n{}'.format(subject, content)
    ers = server.sendmail(from_addr=EMAIL_USERNAME, to_addrs=[to_email], msg=content)
    print(ers)
    server.quit()
