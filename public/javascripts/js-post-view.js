$(document).ready(function() {
	var bigSpinner = '<li id="bigSpinner"><span style="padding: 0 0 0 40%;" uk-spinner="ratio: 2"></span></li>';
	moment.locale('ru');

	/** On Scroll Load comments */
	$(window).scroll(function() {
		if (
			$(window).scrollTop() === $(document).height() - $(window).height() &&
			!isBusy &&
			commentsLen !== exacCommentsLen
		) {
			$('.uk-comment-list').append(bigSpinner);
			$('html').css('overflow-y', 'hidden');
			isBusy = true;

			$.ajax({
				type: 'POST',
				url: '/posts/load-comments',
				data: { commentsLen: commentsLen, id: postId },
				success: function(res) {
					console.log(res.comments.length, commentsLen, exacCommentsLen);
					isBusy = false;
					$('#bigSpinner').remove();
					$('html').css('overflow-y', 'visible');
					if (res.status === 'success') {
						for (var i = 0; i < res.comments.length; i++) {
							var comment = `<li>
							<a id="comment${commentsLen - 1 + i}"></a>
							<article class="uk-comment uk-comment-primary uk-visible-toggle uk-margin-remove">
								<header class="uk-comment-header uk-position-relative">
									<div class="uk-grid-medium uk-flex-middle" uk-grid>
										<div class="uk-width-auto">
											<img class="uk-comment-avatar" src="${res.comments[i].author.avatar}" width="80" height="80" alt="">
										</div>
										<div class="uk-width-expand">
											<h4 class="uk-comment-title uk-margin-remove">
											<a class="uk-link-reset" target="_blank" href="/users/${res.comments[i].author._id}">
													${res.comments[i].author.username}</a></h4>
											<p class="uk-comment-meta uk-margin-remove-top">
													${moment(res.comments[i].createdAt).fromNow()}</p>
										</div>
									</div>
									<div class="uk-position-top-right uk-position-small uk-hidden-hover"><a class="uk-link-muted" href="#sendComment">Ответить</a></div>
								</header>
								<div class="uk-comment-body">
									<p>
										${res.comments[i].text}
									</p>
								</div>
							</article>
						</li>`;
							$('.uk-comment-list').append(comment);
						}

						commentsLen += res.comments.length;

						console.log('Comments in DB:', exacCommentsLen, 'Comments on page:', commentsLen);
					}

					if (res.status === 'error') {
						UIkit.notification({
							message: res.message,
							status: res.status,
							pos: 'top-center',
							timeout: 500
						});
					}
				}
			});
		}
	});

	/** Validation */
	$('#Comment').on('change past input', function() {
		check($(this), 15);
	});

	/** POST */
	$('#SendCommentForm').on('submit', function(event) {
		event.preventDefault();
		var textarea = $(this).find('textarea');
		$('#Comment').trigger('change');

		if (!isBusy && !textarea.hasClass('uk-form-danger')) {
			isBusy = true;
			$('#SubmitBtn').prepend(spinner);
			var data = getFormData($(this));
			textarea.val('');
			var comment = `<li>
							<a id="comment${commentsLen}"></a>
							<article class="uk-comment uk-comment-primary uk-visible-toggle uk-margin-remove">
								<header class="uk-comment-header uk-position-relative">
									<div class="uk-grid-medium uk-flex-middle" uk-grid>
										<div class="uk-width-auto">
											<img class="uk-comment-avatar" src="${user.avatar}" width="80" height="80" alt="">
										</div>
										<div class="uk-width-expand">
											<h4 class="uk-comment-title uk-margin-remove">
											<a class="uk-link-reset" target="_blank" href="/users/${user._id}">
													${user.username}</a></h4>
											<p class="uk-comment-meta uk-margin-remove-top">
													${moment().fromNow()}</p>
										</div>
									</div>
									<div class="uk-position-top-right uk-position-small uk-hidden-hover"><a class="uk-link-muted" href="#sendComment">Ответить</a></div>
								</header>
								<div class="uk-comment-body">
									<p>
										${data.comment}
									</p>
								</div>
							</article>
						</li>`;
			$('.uk-comment-list').prepend(comment);
			$('#NotComments').empty();

			$.ajax({
				type: 'POST',
				url: '/posts/comment',
				data: Object.assign(data, { postId: postId }),
				success: function(response) {
					isBusy = false;

					if (response.status === 'danger') {
						UIkit.notification({
							message: response.message,
							status: response.status,
							pos: 'top-center',
							timeout: 300000
						});
					}
					$('#spinner').remove();
				}
			});
		} else {
			$('.uk-form-danger').focus();
			$('.uk-form-danger').effect('bounce', 'slow');
		}
	});
});
