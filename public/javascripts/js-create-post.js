$(document).ready(function() {
	/** MDE settings */
	var simplemde = new SimpleMDE({
		element: document.getElementById('Article'),
		hideIcons: ['side-by-side'],
		spellChecker: false,
		toolbar: [
			{
				name: 'bold',
				action: SimpleMDE.toggleBold,
				className: 'fa fa-bold',
				title: 'Жирнич'
			},
			{
				name: 'italic',
				action: SimpleMDE.toggleItalic,
				className: 'fa fa-italic',
				title: 'Опущенный текст'
			},
			{
				name: 'strikethrough',
				action: SimpleMDE.toggleStrikethrough,
				className: 'fa fa-strikethrough',
				title: 'Зачеркнутый текст'
			},
			{
				name: 'heading-smaller',
				action: SimpleMDE.toggleHeadingSmaller,
				className: 'fa fa-header',
				title: 'Уменьшить заголовок'
			},
			{
				name: 'heading-bigger',
				action: SimpleMDE.toggleHeadingBigger,
				className: 'fa fa-lg fa-header',
				title: 'Увеличить заголовок'
			},
			'|',
			{
				name: 'unordered-list',
				action: SimpleMDE.toggleUnorderedList,
				className: 'fa fa-list-ul',
				title: 'Маркированный список'
			},
			{
				name: 'ordered-list',
				action: SimpleMDE.toggleOrderedList,
				className: 'fa fa-list-ol',
				title: 'Нумерованный список'
			},
			'|',
			{
				name: 'code',
				action: SimpleMDE.toggleCodeBlock,
				className: 'fa fa-code',
				title: 'Вставка кода'
			},
			{
				name: 'horizontal-rule',
				action: SimpleMDE.drawHorizontalRule,
				className: 'fa fa-minus',
				title: 'Разделитель'
			},
			{
				name: 'table',
				action: SimpleMDE.drawTable,
				className: 'fa fa-table',
				title: 'Вставка таблицы'
			},
			'|',
			{
				name: 'link',
				action: SimpleMDE.drawLink,
				className: 'fa fa-link',
				title: 'Вставка ссылки'
			},
			{
				name: 'image',
				action: SimpleMDE.drawImage,
				className: 'fa fa-picture-o',
				title: 'Вставка изображения'
			},
			'|',
			{
				name: 'preview',
				action: SimpleMDE.togglePreview,
				className: 'fa fa-eye no-disable',
				title: 'Посмотреть, что получилось'
			},
			{
				name: 'fullscreen',
				action: SimpleMDE.toggleFullScreen,
				className: 'fa fa-arrows-alt no-disable',
				title: 'На весь экран'
			},
			{
				name: 'guide',
				action: 'https://simplemde.com/markdown-guide',
				className: 'fa fa-question-circle',
				title: 'Гайд чтобы понять, что за символы вообще'
			}
		],
		insertTexts: {
			image: ['![ТУТ_ОПИСАНИЕ](ТУТ_ВАША_ССЫЛКА', ')'],
			link: ['[ТУТ_НАЗВАНИЕ', '](ТУТ_ВАША_ССЫЛКА)']
		},
		autosave: {
			enabled: true,
			uniqueId: userId,
			delay: 1000
		},
		forceSync: true,
		status: [
			'autosave',
			'lines',
			'words',
			{
				className: 'characters',
				defaultValue: function(el) {
					el.innerHTML = '0';
				},
				onUpdate: function(el) {
					el.innerHTML = $('#Article').val().replace(/\s/g, '').length;
				}
			}
		],
	});

	/** Other vars */
	var bar = document.getElementById('js-progressbar');
	var url = '/posts/create';
	var postID = Date.now()
		.toString()
		.slice(1);
	var fileWasUpload = false;

	/** Validation */
	$('#Title').on('change past input', function() {
		check($(this), 15);
	});

	simplemde.codemirror.on('change', function() {
		$('.CodeMirror').removeClass('uk-form-danger');
	});

	/** Upload image */
	UIkit.upload('#PostImage', {
		url: url,
		mime: 'image/*',
		maxSize: 5000000,
		msgInvalidMime: 'Вы выбрали не изображение',
		msgInvalidName: 'Неверное имя файла',
		msgInvalidSize: 'Максимальный размер файла: 5 MB',
		params: { postID: postID },

		fail: function(msg) {
			$('#ImageInput').attr('placeholder', 'Выберите превьюшку...');
			$('#ImageInput')
				.removeClass('uk-form-success')
				.addClass('uk-form-danger');
			$('#ImageWarn').text(msg);
		},

		beforeAll: function(e) {
			$('#ImageWarn').css('color', '#f0506e');
			$('#ImageWarn').empty();
			$('#ImageInput')
				.removeClass('uk-form-danger')
				.addClass('uk-form-success');
			$('#ImageInput').attr('placeholder', e.$el.files[0].name);
		},

		error: function() {
			$('#ImageInput').attr('placeholder', 'Выберите превьюшку...');
			$('#ImageInput')
				.removeClass('uk-form-success')
				.addClass('uk-form-danger');
			$('#ImageWarn').text('Ошибка на сервере');
		},

		loadStart: function(e) {
			isBusy = true;
			bar.removeAttribute('hidden');
			bar.max = e.total;
			bar.value = e.loaded;
		},

		progress: function(e) {
			bar.max = e.total;
			bar.value = e.loaded;
		},

		loadEnd: function(e) {
			bar.max = e.total;
			bar.value = e.loaded;
			bar.setAttribute('hidden', 'hidden');
		},

		complete: function(res) {
			if (res.response.status === 'danger') {
				$('#ImageInput').attr('placeholder', 'Выберите превьюшку...');
				$('#ImageInput')
					.removeClass('uk-form-success')
					.addClass('uk-form-danger');
				$('#ImageWarn').text('Ошибка на сервере');
			} else {
				$('#ImageWarn').css('color', '#32d296');
				$('#ImageWarn').text('Файл загружен ✔');
				fileWasUpload = true;
			}
			isBusy = false;
		}
	});

	/** POST */
	$('#createPostForm').on('submit', function(event) {
		event.preventDefault();
		var inputs = $(this).find('input');
		$('#Title').trigger('change');

		if (simplemde.value().replace(/\s/g, '').length < 500) {
			$('.CodeMirror').addClass('uk-form-danger');
			UIkit.notification({
				message: 'Нужно больше букв',
				status: 'warning',
				pos: 'top-center',
				timeout: 1000
			});
		}

		if (simplemde.value().replace(/\s/g, '').length > 20000) {
			$('.CodeMirror').addClass('uk-form-danger');
			UIkit.notification({
				message: 'Слишком много букв',
				status: 'warning',
				pos: 'top-center',
				timeout: 1000
			});
		}

		if (!fileWasUpload) {
			$('#ImageInput')
				.removeClass('uk-form-success')
				.addClass('uk-form-danger');
		}

		if (!isBusy && !inputs.hasClass('uk-form-danger') && !$('.CodeMirror').hasClass('uk-form-danger')) {
			isBusy = true;
			$('#SubmitBtn').after(spinner);
			var formData = new FormData(this);
			formData.append('postID', postID);
			formData.append('article', simplemde.value());

			$.ajax({
				type: 'POST',
				url: url,
				data: formData,
				cache: false,
				contentType: false,
				processData: false,
				success: function(response) {
					isBusy = false;

					if (response.message) {
						UIkit.notification({
							message: response.message,
							status: response.status,
							pos: 'top-center',
							timeout: 10000
						});
					}

					$('#spinner').remove();

					if (response.status === 'success') {
						isBusy = true;
						setTimeout(function() {
							window.location.replace('/');
						}, 2000);
					}
				}
			});
		} else {
			$('.uk-form-danger').focus();
			$('.uk-form-danger').effect('bounce', 'slow');
		}
	});
});
