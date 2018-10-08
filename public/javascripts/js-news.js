$(document).ready(function() {
	var bigSpinner = '<span id="bigSpinner" style="padding: 6% 0 0 45%;" uk-spinner="ratio: 3"></span>';
	var postsLen = 0;
	var likedPosts = [];

	/** Load first 5 posts */
	loadPosts();

	/** On Scroll Load posts */
	$(window).scroll(function() {
		if ($(window).scrollTop() === $(document).height() - $(window).height() && exacPostsLen !== postsLen) {
			loadPosts();
		}
	});

	function loadPosts() {
		if (!isBusy) {
			isBusy = true;
			$('#News').append(bigSpinner);
			$.ajax({
				type: 'POST',
				url: '/',
				data: { posts: postsLen },
				success: function(res) {
					console.log('Response obj:', res.obj);
					$('#bigSpinner').remove();
					isBusy = false;

					if (res.status === 'success') {
						likedPosts = res.obj.your.likedPosts;
						postsLen += res.obj.posts.length;
						console.log('Posts in DB:', exacPostsLen, 'Posts on page:', postsLen);
						console.log('Liked posts:', likedPosts);
						var options = {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							timezone: 'UTC',
							hour: 'numeric',
							minute: 'numeric',
							second: 'numeric'
						};

						for (var post of res.obj.posts) {
							var created = new Date(post.createdAt);
							var likeBtn = '';

							if (res.obj.your.id) {
								likeBtn = `<div id="Like${post._id}" class="uk-card-badge uk-label">
							<span id="counter">${post.likes.count}</span> <span uk-icon="heart"></span>
						</div>`;
							}
							var template =
								`<div class="uk-card uk-card-default uk-grid-collapse uk-child-width-1-3@s uk-margin" uk-grid>
				<div class="uk-card-media-left uk-cover-container">
					<img src="/images/uploads/${post.image}" alt="" uk-cover>
					<canvas width="200" height="200"></canvas>
				</div>
				<div class="uk-width-expand">
					<div class="uk-card-header">
						<div class="uk-grid-small uk-flex-middle" uk-grid>
							<div class="uk-width-expand">
								<h3 class="uk-card-title uk-margin-remove-bottom">${post.title}</h3>
								<p class="uk-text-meta uk-margin-remove-top">
									<time datetime="${created}">${created.toLocaleString('ru', options)}</time>
								</p>
							</div>
						</div>
					</div><div class="uk-card-body">` +
								likeBtn +
								`<p class="unselectable">${post.article.replace(/<(?:.|\n)*?>/gm, '').slice(0, 200)}...</p>
					</div><div class="uk-card-footer">
						<a href="/posts/${post.urlPath}" class="unselectable uk-button uk-button-text">Читать дальше</a>
					</div>
				</div>
			</div>`;
							$('#News').append(template);

							if (res.obj.your.id) {
								$(`#Like${post._id}`).on('click', function() {
									var curentPostId = $(this)
										.attr('id')
										.slice(4);
									var $counter = $(this).find('#counter');
									toggleLikes($counter, curentPostId);

									if (!isBusy) {
										isBusy = true;
										$.ajax({
											type: 'POST',
											url: '/posts/like',
											data: { id: curentPostId },
											success: function() {
												isBusy = false;
											}
										});
									}
								});
							}
						}
					}

					if (res.status === 'error') {
						$('#News').append(`<h3 style="color: red; padding: 6% 0 0 45%">${res.message}</h3>`);
					}
				}
			});
		}
	}

	function toggleLikes($counter, curentPostId) {
		var c = 0;
		var counter = parseInt($counter.text());

		if (likedPosts.length > 0) {
			for (var postId of likedPosts) {
				c++;
				if (postId === curentPostId) {
					$counter.text(--counter);
					likedPosts = likedPosts.filter(function(value) {
						return postId !== value;
					});
					break;
				} else if (c === likedPosts.length) {
					$counter.text(++counter);
					likedPosts.push(curentPostId);
					break;
				}
			}
		} else {
			$counter.text(++counter);
			likedPosts.push(curentPostId);
		}
		console.log('Liked posts:', likedPosts);
	}
});
