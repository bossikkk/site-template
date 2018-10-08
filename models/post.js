const mongoose = require('mongoose');

let postSchema = new mongoose.Schema({
	createdAt: { type: Date, default: Date.now },
	urlPath: String,
	title: String,
	article: String,
	image: String,
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	likes: {
		count: { type: Number, default: 0 },
		users: [{ type: mongoose.Schema.Types.ObjectId }]
	},
	comments: [
		{
			author: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			text: String,
			createdAt: { type: Date, default: Date.now }
		}
	]
});

postSchema.methods.like = function(user_id) {
	let index = this.likes.users.indexOf(user_id);
	if (index < 0) {
		this.likes.count++;
		this.likes.users.push(user_id);
	} else if (this.likes.count > 0) {
		this.likes.count--;
		this.likes.users.splice(index, 1);
	}
	return this.save();
};

postSchema.methods.comment = function(c) {
	this.comments.push(c);
	return this.save();
};


module.exports = mongoose.model('Post', postSchema);