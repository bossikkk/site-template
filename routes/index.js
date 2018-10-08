const router = require('express').Router();
const Post = require('../models/post');

/* GET home page. */
router.get('/', async function({ renderObject }, res) {
	let posts = await Post.find({});
	renderObject.exacPostsLen = posts.length;
	res.render('index', renderObject);
});

router.post('/', async function({ body, renderObject }, res, next) {
	try {
		if (!body.posts) {
			throw new Error('Required params does not exists');
		}
		let posts = await Post.find({}, [], {
			skip: Number(body.posts), // Starting Row
			limit: 5, // Ending Row
			sort: {
				createdAt: -1 //Sort by Date Added DESC
			}
		});
		if (posts.length === 0) {
			throw new Error('Нет постов :(');
		}
		let likedPosts = [];
		if (renderObject.user) {
			for (let post of posts) {
				for (let user_id of post.likes.users) {
					if (String(user_id) === String(renderObject.user._id)) {
						likedPosts.push(post._id);
					}
				}
			}
		}

		let newRenderObj = {
			posts: posts,
			your: { id: renderObject.user ? renderObject.user._id : undefined, likedPosts: likedPosts }
		};

		res.json({ status: 'success', obj: newRenderObj });
	} catch (error) {
		res.json({ status: 'error', message: error.message });
	}
});

router.get('/profile', function({ renderObject }, res) {
	if (renderObject.user) {
		res.render('profile', renderObject);
	} else {
		res.sendStatus(404);
	}
});

router.get('/about', function({ renderObject }, res) {
	res.render('about', renderObject);
});

module.exports = router;
