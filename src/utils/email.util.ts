import * as nodemailer from 'nodemailer';

export const createTransporter = (emailUser: string, emailPass: string) => {
  return nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};
