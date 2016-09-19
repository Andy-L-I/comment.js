'use strict';

$(document).on('click', '#add-comment', function (e) {
    e.preventDefault();
    showCommentForm();
});

$(document).on('click', '#cancel-comment', function (e) {
    e.preventDefault();
    hideCommentForm();
});

function hideCommentForm() {
    $('#add-comment').addClass('nocheck');
    $('#comment-form').slideUp('slow');
    $('#ico1').slideDown('slow');
}

function showCommentForm() {
    let addComment = $('#add-comment');
    let commentForm;
    if (addComment.hasClass('nocheck')) {
        commentForm = $('#comment-form');
        commentForm.find('.wrapper-alert').empty();
        addComment.removeClass('nocheck');
        $('#ico1').slideUp('slow');
        commentForm.slideDown('slow');
    }
}

/**
 * Добавление комментария к вакансии или резюме.
 */
$(document).on('submit', '#comment-form', function (e) {
    e.preventDefault();
    new Ajax().sendForm(e).then(function (data) {
        let self = $(e.target);
        $('#comments-list').prepend(data.message.html);
        self.closest('#comment_modal').modal('hide');
        self.find('textarea').val(null);
        hideCommentForm();
    }).catch(errors => new Alert().showRabotaErrorAlert($(e.target).find('.wrapper-alert'), errors, false));
});

/**
 * Удаление комментария к вакансии или резюме.
 */
$(document).on('click', '.delete-comment', function (e) {
    e.preventDefault();
    $(this).closest('form').trigger('submit');
});

$(document).on('submit', '.form-delete-comment', function (e) {
    let $self = $(this);
    let spinner = getSpinner();
    let $deleteLink = $self.find('.delete-comment');
    let $wrapper = $self.closest('.wrapper-comment');
    let html = `<div data-id="${$self.find('.comment-id').val()}" class="col-xxs-12 col-xs-12 col-sm-12 restore-comment text-center" style="min-height: 22px;">
                    <a href="#">Восстановить</a>
                </div>`;

    $deleteLink.find('i').css('visibility', 'hidden');
    spinner.spin($deleteLink[0]);

    new Ajax().sendForm(e).then(data => {
        $wrapper.find('.row > div').addClass('hide');
        $wrapper.find('.row').append(html);
        $deleteLink.find('i').css('visibility', 'visible');
        spinner.stop();
    }).catch(errors => new Alert().toastrError(errors));
});

/**
 * Восстановление комментария к вакансии или резюме.
 */
$(document).on('click', '.restore-comment', function (e) {
    e.preventDefault();
    let spinner = getSpinner();
    let $self = $(this);
    let url = '/ajax/restore-comment';

    $self.find('a').css('visibility', 'hidden');
    spinner.spin($self[0]);

    new Ajax().httpRequest(url, {id: $self.data('id')}, 'POST').then(response => {
        $self.closest('.wrapper-comment').find('.row > div').removeClass('hide');
        $self.remove();
        spinner.stop();
    }).catch(errors => new Alert().toastrError(errors));
});

function getSpinner() {
    return new Spinner({
        lines: 11,
        length: 5,
        width: 3,
        radius: 3,
        color: '#333'
    });
}
