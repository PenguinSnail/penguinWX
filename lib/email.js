const nodemailer = require('nodemailer');

// taken from https://nodemailer.com/about/

module.exports = (config, subject, message, imgfiles) => {

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

	let attachments_array = [];
	imgfiles.forEach((item) => {
		attachments_array.push({path: item});
	});

	// send mail with defined transport object
	transporter.sendMail({
		from: 'PenguinWX@PenguinWX', // sender address
		to: config.email.receiveAddress, // list of receivers
		subject: subject, // Subject line
		text: message, // plain text body
		attachments: attachments_array
	}).then((info) => {
		console.log('Message sent: %s', info.messageId);
	}).catch((error) => {
		console.log('ERROR SENDING MAIL')
		console.log(error);
	});
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

	// Preview only available when sending through an Ethereal account
	//console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
	// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}