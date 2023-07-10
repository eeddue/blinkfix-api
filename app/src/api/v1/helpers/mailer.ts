import nodemailer, { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

try {
  nodemailer.createTransport({
    host: '51.161.0.35.7',
    port: 587,
    secure: false, // use SSL
    auth: {
      user: 'info@blinkfix.me',
      pass: 'Nie1zgadniesz',
    },
  });
} catch (error: any) {
  console.warn(error.message);
}

class MailerController {
  transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'mx0.blinkfix.me',
      port: 587,
      secure: false, // use SSL
      auth: {
        user: 'info@blinkfix.me',
        pass: 'zaq1@WSX',
      },
    });
  }

  async sendEmail(options: Mail.Options) {
    let info = await this.transporter.sendMail({ from: 'blinkfix support <info@blinkfix.me>', ...options });
    const res = this.transporter.sendMail(options, (error, info) => {
      if (error) {
        throw new Error(error.message);
      } else {
        console.log('Message sent: %s', info.messageId);
      }
    });

    console.log('Message sent: %s', info.messageId);
    return info;
  }
}
export default MailerController;
