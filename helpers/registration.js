const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const config = require('../configs/config');

class Registration {
	constructor(username, password, email, subscribe) {
		this.username = username;
		this.password = password;
		this.email = email;
		this.subscribe = subscribe;
		this.verifCode = [...Array(50)].map(() => (~~(Math.random() * 36)).toString(36)).join('');

		this.transporter = nodemailer.createTransport({
			host: config.smtp.host,
			port: config.smtp.port,
			secure: true, // true for 465, false for other ports
			auth: {
				user: config.smtp.user,
				pass: config.smtp.pass
			}
		});

		this.mailOptions = {
			from: `"Balabol" <${config.smtp.user}>`,
			to: this.email,
			subject: 'Подтвердите регистрацию ✔',
			text: 'Text message',
			html:
				'<b>Здравствуйте, пройдите по ссылке, для активации учетной записи: </b>' +
				`<a href="${config.host}/auth/verificate?code=${this.verifCode}">${config.host}/verificate</a>`
		};
	}

	async checkUserExists() {
		let user = await User.findOne({
			$or: [{ username: this.username }, { email: this.email }]
		});

		if (user && user.email === this.email) {
			throw new Error('Этот email уже используется');
		}
		if (user && user.username === this.username) {
			throw new Error('Это имя уже используется');
		}
		return false;
	}

	async encryptPass() {
		let salt = await bcrypt.genSalt(12);
		let password =  bcrypt.hash(this.password, salt);
		return password;
	}

	async createUser(encryptedPass) {
		await User.updateOne(
			{ username: this.username },
			{
				$set: {
					password: encryptedPass,
					email: this.email,
					subscribe: this.subscribe,
					verified: false,
					avatar: '/images/avatar.png'
				}
			},
			{ upsert: true }
		);
		return true;
	}

	async verification() {
		await this.transporter.sendMail(this.mailOptions);
		return {
			code: this.verifCode,
			username: this.username,
			mess: 'На ваш email высланно письмо'
		};
	}
}

module.exports = Registration;
