require('dotenv').config();

module.exports = {
	host: process.env.HOST,
	mongo: process.env.MONGO_URL,
	redis: process.env.REDIS_URL,
	secretString: process.env.SECRET,
	smtp: {
		host: process.env.SMTP_PORT,
		port: process.env.SMTP_PORT,
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWORD
	},
	googleOauth: {
		client_id: process.env.GOOGLE_CLIENT_ID,
		project_id: process.env.GOOGLE_PROJECT_ID,
		auth_uri: 'https://accounts.google.com/o/oauth2/auth',
		token_uri: 'https://www.googleapis.com/oauth2/v3/token',
		auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
		client_secret: process.env.GOOGLE_CLIENT_SECRET
	},
	facebookOauth: {
		client_id: process.env.FACEBOOK_CLIENT_ID,
		client_secret: process.env.FACEBOOK_CLIENT_SECRET	
	}
};
