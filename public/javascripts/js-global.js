var isBusy = false;
var spinner = '<span id="spinner" class="uk-margin-small-right" uk-spinner="ratio: 1"></span>';
var socket = io();

$(document).ready(function() {
	/** Set active menu */
	$('#Menu li a').each(function() {
		if ($(this).attr('href') === window.location.pathname) {
			$(this)
				.parent()
				.addClass('uk-active');
		}
	});
	$('#MobileMenu li a').each(function() {
		if ($(this).attr('href') === window.location.pathname) {
			$(this)
				.parent()
				.addClass('uk-active');
		}
	});
	$('#DropMenu li a').each(function() {
		if ($(this).attr('href') === window.location.pathname) {
			$(this)
				.parent()
				.addClass('uk-active');
		}
	});

	/** Prevent following to active menu item */
	$('.uk-active').click(function(event) {
		event.preventDefault();
	});

	/** Validation */
	$('.name').on('change paste input', function() {
		check($(this), 4);
	});
	$('.pass, .email').on('change paste input', function() {
		check($(this), 7);
	});

	/** Clear */
	$('.uk-modal-close').on('click', function() {
		$(this)
			.closest('form')
			.find('input')
			.each(function() {
				$(this).removeClass('uk-form-danger uk-form-success');
				$(this).val('');
			});
	});

	/** POST */
	$('#regForm, #logForm').on('submit', function(event) {
		event.preventDefault();
		var inputs = $(this).find('input');

		inputs.each(function() {
			var symbols = 7;
			if ($(this).attr('name') === 'username') {
				symbols = 4;
			}
			check($(this), symbols);
		});

		var url = '/auth/login';
		if ($(this).attr('id') === 'regForm') {
			url = '/auth/register';
		}

		if (!isBusy && !inputs.hasClass('uk-form-danger')) {
			isBusy = true;
			$(this)
				.find('.uk-text-right')
				.prepend(spinner);
			var data = getFormData($(this));

			$.ajax({
				type: 'POST',
				url: url,
				data: data,
				success: function(response) {
					isBusy = false;

					if (response.message) {
						UIkit.notification({
							message: response.message,
							status: response.status,
							pos: 'top-center',
							timeout: 30000
						});
					} else {
						location.reload();
					}

					$('#spinner').remove();

					if (response.status === 'primary') {
						UIkit.modal('#' + url.slice(6)).hide();
						$(this)
							.find('input')
							.each(function() {
								$(this).removeClass('uk-form-danger uk-form-success');
								$(this).val('');
							});
					}
				}
			});
		} else {
			$('.uk-form-danger').focus();
			$('.uk-form-danger').effect('bounce', 'slow');
		}
	});
});

/** Some func */
function check(_this, length) {
	if (_this.attr('name') === 'username' || _this.attr('name') === 'password') {
		if (_this.val().match(/^[a-zA-Z0-9]+$/) && _this.val().length > length) {
			_this.removeClass('uk-form-danger').addClass('uk-form-success');
		} else {
			_this.removeClass('uk-form-success').addClass('uk-form-danger');
		}
	}

	if (_this.attr('name') === 'email') {
		var regExp = /^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@([a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(ru|aero|de|asia|biz|cat|com|info|int|jobs|net|org)$/;
		if (_this.val().match(regExp) && _this.val().length > length) {
			_this.removeClass('uk-form-danger').addClass('uk-form-success');
		} else {
			_this.removeClass('uk-form-success').addClass('uk-form-danger');
		}
	}


	if (_this.attr('name') === 'comment') {
		if (_this.val().length > length && _this.val().length < 1000) {
			_this.removeClass('uk-form-danger').addClass('uk-form-success');
		} else {
			_this.removeClass('uk-form-success').addClass('uk-form-danger');
		}
	}

	if (_this.attr('name') === 'title') {
		if (_this.val().length > length && _this.val().length < 100) {
			_this.removeClass('uk-form-danger').addClass('uk-form-success');
		} else {
			_this.removeClass('uk-form-success').addClass('uk-form-danger');
		}
	}

	if (_this.val().length === 0) {
		_this.removeClass('uk-form-danger');
	}
}

function getFormData($form) {
	var unindexed_array = $form.serializeArray();
	var indexed_array = {};

	$.map(unindexed_array, function(n) {
		indexed_array[n['name']] = n['value'];
	});

	return indexed_array;
}

/** WebScokets */
socket.emit('request_curr');

setInterval(() => {
	socket.emit('request_curr');
}, 7000);

socket.on('update', function(data) {
	for (var key in data) {
		$(`#${key}`).text(data[key].toFixed(3) + ' руб.');
	}
});
