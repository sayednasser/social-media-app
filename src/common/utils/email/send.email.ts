import nodemailer from "nodemailer"
import { EMAIL_APP, EMAIL_APP_PASSWORD } from "../../../config/config";
import Mail from "nodemailer/lib/mailer";
export const sendEmail = async ({
    to,
    cc,
    bcc,
    subject,
    html,
    attachments = []

} :Mail.Options) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_APP,
            pass: EMAIL_APP_PASSWORD,
        },
    });

    // Send an email using async/await
    (async () => {
        const info = await transporter.sendMail({
            to,
            cc,
            bcc,
            html,
            subject,
            attachments,
            from: `Social media app🌸 ${EMAIL_APP}`,

        });

        console.log("Message sent:", info.messageId);
    })();
}
