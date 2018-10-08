const router = require('express').Router();
const passport = require('passport');

const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const Registration = require('../helpers/registration');
const config = require('../configs/config');

const User = require('../models/user');

/** Serialize and deserialize */
passport.serializeUser(function(user, done) {
	done(null, {
		id: user.id,
		username: user.username,
		subscribe: user.subscribe,
		avatar: user.avatar,
		email: user.email,
		verified: true
	});
});

passport.deserializeUser(function(user, done) {
	User.findById(user.id, function(err, user) {
		done(err, user);
	});
});

/** Local Strategy */
passport.use(
	new LocalStrategy(function(username, password, done) {
		User.findOne({ username: username }, function(err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, { danger: 'Пользователя не существует' });
			}
			if (!User.validPassword(password, user.password)) {
				return done(null, false, { danger: 'Неправильный пароль' });
			}
			return done(null, user);
		});
	})
);

router.post('/login', function(req, res, next) {
	let { session, body } = req;
	if (!body.username || !body.password) {
		next(new Error('Required params does not exists'));
	} else {
		passport.authenticate('local', async function(err, user, info) {
			try {
				if (err) {
					throw new Error(err.message);
				}

				if (info) {
					throw new Error(info.danger);
				}

				if (user) {
					if (!user.verified && session.verification) {
						throw new Error(`Вы не подтвердили почту: ${user.email}`);
					}

					if (!user.verified && !session.verification) {
						let newAttempt = new Registration(user.username, null, user.email);
						let verif = await newAttempt.verification();

						session.verification = {
							username: verif.username,
							code: verif.code
						};

						return res.json({
							message: `Новая ссылка отправлена на почту: ${user.email}`,
							status: 'primary'
						});
					}

					if (user.verified) {
						req.logIn(user, function(err) {
							if (err) {
								throw new Error(err.message);
							}
							return res.send(true);
						});
					}
				}
			} catch (error) {
				return res.json({
					message: error.message,
					status: 'danger'
				});
			}
		})(req, res, next);
	}
});

router.post('/register', async function({ session, body }, res, next) {
	if (!body.username || !body.password || !body.email) {
		next(new Error('Required params does not exists'));
	} else {
		let newUser = new Registration(body.username, body.password, body.email, body.subscribe ? true : false);

		try {
			await newUser.checkUserExists();
			let encryptedPass = await newUser.encryptPass();
			await newUser.createUser(encryptedPass);
			let verif = await newUser.verification();

			session.verification = {
				username: verif.username,
				code: verif.code
			};

			res.json({
				message: verif.mess,
				status: 'primary'
			});
		} catch (error) {
			res.json({
				message: error.message,
				status: 'danger'
			});
		}
	}
});

router.get('/verificate', async function(req, res) {
	let { query, session } = req;
	try {
		if (!session.verification) {
			throw new Error('Срок верификации истек. Чтобы получить новую ссылку - войдите на сайте используя ваши данные.');
		}

		if (query.code !== session.verification.code) {
			throw new Error('Неправильный код валидации.');
		}

		let user = await User.findOneAndUpdate({ username: session.verification.username }, { $set: { verified: true } });

		req.logIn(user, function(err) {
			if (err) {
				throw new Error(err.message);
			}
			return res.redirect('/');
		});
	} catch (error) {
		res.json({ Verfication: false, Error: error.message });
	}
});

router.get('/logout', function(req, res) {
	let { session } = req;
	if (session) {
		session.destroy();
	}
	res.redirect(req.get('referer'));
});

/** Google+ Strategy */
passport.use(
	new GoogleStrategy(
		{
			clientID: config.googleOauth.client_id,
			clientSecret: config.googleOauth.client_secret,
			callbackURL: `${config.host}/auth/google/callback`
		},
		function(accessToken, refreshToken, profile, done) {
			User.findOneAndUpdate(
				{ googleId: profile.id },
				{
					$set: {
						username: profile.displayName,
						subscribe: false,
						avatar: profile.photos ? profile.photos[0].value : '/images/avatar.png',
						email: profile.emails[0].value
					}
				},
				{ upsert: true, new: true },
				function(err, user) {
					if (err) {
						return done(err);
					}
					return done(null, user);
				}
			);
		}
	)
);

router.get(
	'/google',
	passport.authenticate('google', {
		scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
	})
);

router.get('/google/callback', function(req, res, next) {
	passport.authenticate('google', function(err, user) {
		if (err) {
			next(err);
		}

		if (user) {
			req.logIn(user, function(err) {
				if (err) {
					next(err);
				}
				return res.redirect(req.get('referer'));
			});
		}
	})(req, res, next);
});

/** Facebook Strategy */
passport.use(
	new FacebookStrategy(
		{
			clientID: config.facebookOauth.client_id,
			clientSecret: config.facebookOauth.client_secret,
			callbackURL: `${config.host}/auth/facebook/callback`,
			profileFields: ['id', 'displayName', 'emails', 'picture.type(large)']
		},
		function(accessToken, refreshToken, profile, done) {
			User.findOneAndUpdate(
				{ facebookId: profile.id },
				{
					$set: {
						username: profile.displayName,
						subscribe: false,
						avatar: profile.photos ? profile.photos[0].value : '/images/avatar.png',
						email: profile.emails[0].value
					}
				},
				{ upsert: true, new: true },
				function(err, user) {
					if (err) {
						return done(err);
					}
					return done(null, user);
				}
			);
		}
	)
);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', function(req, res, next) {
	passport.authenticate('facebook', function(err, user) {
		if (err) {
			next(err);
		}

		if (user) {
			req.logIn(user, function(err) {
				if (err) {
					next(err);
				}
				return res.redirect(req.get('referer'));
			});
		}
	})(req, res, next);
});

module.exports = router;
