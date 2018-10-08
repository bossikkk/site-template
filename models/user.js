const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const message = 'field missed!';

let userSchema = new mongoose.Schema({
	googleId: String,
	facebookId: String,
	username: { type: String, required: message },
	password: String,
	email: { type: String, required: message },
	subscribe: Boolean,
	verified: Boolean,
	avatar: String,
	created: { type: Date, default: Date.now }
});

userSchema.statics.validPassword = function(password, hash) {
	return bcrypt.compareSync(password, hash);
};

module.exports = mongoose.model('User', userSchema);
