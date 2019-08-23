const nodemailer = require('nodemailer');

// taken from https://nodemailer.com/about/

module.exports = (config, subject, message, imgfile) => {

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: config.email.user,
			pass: config.email.pass
		}
	});

	// send mail with defined transport object
	transporter.sendMail({
		from: 'PenguinWX@PenguinWX', // sender address
		to: config.email.receiveAddress, // list of receivers
		subject: subject, // Subject line
		text: message, // plain text body
		attachments: [
			{
				path: imgfile
			}
		]
	}).then((info) => {
		console.log('Message sent: %s', info.messageId);
	});
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	// Preview only available when sending through an Ethereal account
	//console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
	// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}