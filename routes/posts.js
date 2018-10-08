const moment = require('moment');
moment.locale('ru');
const router = require('express').Router();
const fs = require('fs');
const mongoose = require('mongoose');
const transpliter = require('cyrillic-to-translit-js');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 5000000
	}
});
const cheerio = require('cheerio');
const showdown = require('showdown');
showdown.extension('uk-ext', function() {
	return [
		{
			type: 'output',
			filter: function(html, converter, options) {
				const $ = cheerio.load(html, { decodeEntities: false }); //parse the html string
				let wrap1 = '<div class="uk-margin" align="left" uk-lightbox="animation: fade">';
				let images = $('img');
				images.each((i, e) => {
					let wrap2 = `<a data-caption="${$(e).attr('alt')}" href="${$(e).attr('src')}">`;
					$(e)
						.first()
						.before(wrap1)
						.prev()
						.append(e);
					$(e)
						.first()
						.before(wrap2)
						.prev()
						.append(e);
				});
				return $('body').html();
			}
		}
	];
});
const converter = new showdown.Converter({ tables: true, strikethrough: true, extensions: ['uk-ext'] });

const Post = require('../models/post');

router.get('/create', function({ renderObject }, res) {
	if (renderObject.user) {
		res.render('createPost', renderObject);
	} else {
		res.sendStatus(404);
	}
});

router.post('/create', upload.single('image'), async function({ body, file, user }, res) {
	console.log(body);
	try {
		let id = new mongoose.Types.ObjectId(body.postID);
		if (file) {
			let fileName = Date.now() + '-' + file.originalname;
			let post = await Post.findById(id);

			if (post) {
				fileName = post.image;
			} else {
				new Post({
					_id: id,
					image: fileName,
					author: user.id
				}).save();
			}
			let writer = fs.createWriteStream(`./public/images/uploads/${fileName}`);
			writer.end(file.buffer);
			writer.on('finish', () => {
				res.send(true);
			});
		} else {
			let urlPath = transpliter()
				.transform(body.title, '-')
				.replace(/[^A-zА-я-0-9]/gi, '')
				.toLowerCase();
			let postExist = await Post.findOne({
				urlPath: urlPath
			});
			if (postExist) throw new Error('Пост с таким заголовком уже существует.');
			await Post.updateOne(
				{
					_id: id
				},
				{
					$set: {
						urlPath: urlPath,
						title: body.title,
						article: converter.makeHtml(body.article[0])
					}
				}
			);
			res.json({
				message: 'Пост создан. Перенаправление...',
				status: 'success'
			});
		}
	} catch (error) {
		res.json({
			message: error.message,
			status: 'danger'
		});
	}
});

router.get('/:title', async function({ params, renderObject }, res) {
	try {
		let post = await Post.findOne({
			urlPath: params.title
		}).populate('author comments.author', 'username avatar');
		if (post) {
			post.createdStr = moment(post.createdAt).format('Do MMMM YYYY в HH:mm:ss');
			post.comments.map(c => {
				return (c.createdFrom = moment(c.createdAt).fromNow());
			});
			renderObject.post = post;
			res.render('post', renderObject);
		} else {
			res.sendStatus(404);
		}
	} catch (error) {
		next(error);
	}
});

router.post('/load-comments', async function({ body }, res) {
	try {
		if (!body.commentsLen || !body.id) {
			throw new Error('Missed some field');
		}
		let post = await Post.findById(body.id).populate('author comments.author', 'username avatar');
		if (!post) res.sendStatus(404);
		let comments = Array.from(post.comments)
			.reverse()
			.splice(body.commentsLen, 5);

		res.json({ comments, status: 'success' });
	} catch (error) {
		res.json({
			message: error.message,
			status: 'danger'
		});
	}
});

router.post('/like', async function({ body, user }, res) {
	try {
		let post = await Post.findById(body.id);
		await post.like(user.id);
		res.json({
			message: 'ОК',
			status: 'success'
		});
	} catch (error) {
		res.json({
			message: error.message,
			status: 'danger'
		});
	}
});

router.post('/comment', async function({ body, user }, res) {
	try {
		if (!body.comment || !body.postId) {
			throw new Error('Missed some field');
		}

		let post = await Post.findById(body.postId);
		if (!post) new Error('Post not found');

		await post.comment({
			author: user.id,
			text: body.comment
		});

		res.json({
			message: 'ОК',
			status: 'success'
		});
	} catch (error) {
		res.json({
			message: error.message,
			status: 'danger'
		});
	}
});

module.exports = router;
