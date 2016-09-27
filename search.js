'use strict';

let status = true; // можно ли отправлять форму.
let formTag = '#search-form';
let mobileFormTag = '#mobile-search-form';
let searchContainerTag = '#search-pjax-container';
let form = $(formTag);
let mobileForm = $(mobileFormTag);
let spinner = new Spinner({
    lines: 11,
    length: 5,
    width: 3,
    radius: 5
});

/* ==========================================================================
 * Отправка формы поиска.
 * ========================================================================== */
(function () {
    let oldUrl;
    $(document).on('submit', `${formTag}, ${mobileFormTag}`, function (e) {
        e.preventDefault();
        if (!status) {
            return false;
        }
        let isMobile = e.target.id === mobileFormTag.replace('#', '');
        let selectedForm = isMobile ? mobileForm : form;

        if (isMobile) {
            closeMobileSearch();
            $('html, body').scrollTop(0);
        }

        let url = selectedForm.attr('action') + '?' + selectedForm.serialize();
        // слишком часто форма отправляется на разных событиях. Защита чтобы не отправлять
        // на сервер форму, данные которой не изменились с прошлого запроса.
        if (oldUrl === url) {
            return;
        } else {
            oldUrl = url;
        }
        if ($(searchContainerTag).length) {
            $.pjax.reload(searchContainerTag, {
                url: url,
                timeout: 5000,
                push: true,
                replace: false,
                scrollTo: false
            });
        } else {
            window.location.assign(url);
        }
    });
})();

/* ==========================================================================
 * Установка активного класса для элементов формы поиска.
 * ========================================================================== */
$(document).on('change keyup', '.can-active', function (event) {
    let $this = $(this);
    let value = $this.val();
    let setUp = $this.is(':checkbox') ? $this.prop('checked') : +value;
    let $wrapper = $this.closest('.active-wrapper');
    if (isNaN(setUp)) {
        setUp = !!value.length;
    }
    setUp ? $wrapper.addClass('active') : $wrapper.removeClass('active');
});

/* ==========================================================================
 * Обновление списка выбранных категорий / подкатегорий.
 * Используется как для десктопа, так и для моб. девайса.
 * ========================================================================== */
$(document).on('change', `${formTag} input[name^="category"], ${formTag} input[name^="subcategory"]`, function () {
    updateSelectedCategories($(this).closest('form'));
});
function updateSelectedCategories($form) {
    let $checkedCategories = $form.find('input[name^="category"]:checked');
    let isMobileForm = $form.attr('id') === 'mobile-search-form';

    if ($checkedCategories.length) {
        let i = 0;
        let html = '';
        let limit = 5;
        $checkedCategories.each(function () {
            i++;
            if (i <= limit) {
                let name = isMobileForm
                    ? $(this).closest('li').find('a').html()
                    : $(this).closest('label').find('.lbl-name').text();
                if (name) {
                    name = name.slice(0, name.indexOf('<') - 1);
                    html += `<li>${name}</li>`;
                }
            }

            if (i === limit) {
                i++;
                html += '<li> ... </li>';
            } else if (i > limit) {
                return null;
            }
        });

        $form.find('input[name^="subcategory"]:checked').each(function () {
            i++;
            if (i <= limit) {
                let name = $(this).closest('label').find('.lbl-name').text();
                if (name) {
                    html += `<li>${name}</li>`;
                }
            }

            if (i === limit) {
                i++;
                html += '<li><a href="#" class="more-categories">Еще</a></li>';
            } else if (i > limit) {
                return null;
            }
        });

        $('.selected-categories ul').html(html).closest('.active-wrapper').addClass('active');
        $('.selected-categories').removeClass('hide');
    } else {
        $('.selected-categories').addClass('hide');
        $('.selected-categories ul').empty().closest('.active-wrapper').removeClass('active');
    }
}

/* ==========================================================================
 * Отправка формы по клику энтером в текстовом поле.
 * Используется только для десктопной формы.
 * ========================================================================== */
$(document).on('keyup', `${formTag} input[type="text"]`, function (e) {
    let l = e.target.value.length;
    if (e.keyCode === 13 && (l > 2 || l === 0)) {
        form.trigger('submit');
    }
});

/* ==========================================================================
 * Отправка формы при потере фокуса в текстовом поле.
 * Используется только для десктопной формы.
 * ========================================================================== */
$(document).on('blur', `${formTag} input[type="text"]`, function (e) {
    let l = e.target.value.length;
    if (status && (l > 2 || l === 0)) {
        form.trigger('submit');
    }
});

/* ==========================================================================
 * Отправка формы при выборе в списке typeahead.
 * ========================================================================== */
$(document).on('typeahead:select', '.keyword', function () {
    $(this).closest('form').trigger('submit');
});
$(document).on('typeahead:select', '.keyword-input', function () {
    $('.keyword-input').val($(this).val());
});

/* ==========================================================================
 * Отправка формы при выборе в селекте, чекбоксе.
 * ========================================================================== */
$(document).on('change', `${formTag} select.submit-change, ${formTag} input[type="checkbox"].submit-change`, function () {
    form.trigger('submit');
});

/* ==========================================================================
 * При клике в окне дропдауна (списки рубрики и подрубрик), окно закрывается.
 * Останавливаю дальнейшую обработку события.
 * ========================================================================== */
$(document).on('click', '.dropdown-rubrics-menu-right', function (e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
});

/* ==========================================================================
 * Обновление списка подкатегорий при выборе категории.
 * ========================================================================== */
$(document).on('change', `${formTag} input[name^="category"]`, function () {
    updateDesktopSubcategories($(this));
});
function updateDesktopSubcategories($element) {
    let categoryID = $element.data('id');
    if ($element.prop('checked') && Object.keys(rabota.subcategories).length && Object.keys(rabota.subcategories[categoryID]).length) {
        if ($(`#wrapper-category-${categoryID}`).length) {
            return;
        }

        let html = `<div id="wrapper-category-${categoryID}">
                        <p class="strong">${rabota.categories[categoryID]}</p>
                        <ul class="list-unstyled" style="position: relative;">`;

        for (let i in rabota.subcategories[categoryID]) {
            html += `<li class="form-group__item-checkbox">
                        <label>
                            <input type="checkbox" name="subcategory[${i}]" value="1">
                            <span class="lbl padding-8">
                                <span class="lbl-name">${rabota.subcategories[categoryID][i]}</span>
                            </span>
                        </label>
                     </li>`;
        }

        html += `</ul></div>`;
        $('#subcategory-container').append(html);
    } else {
        $(`#wrapper-category-${categoryID}`).remove();
    }
}

/* ==========================================================================
 * Переключение текста на кнопке открытия окна дропдауна (список рубрик / подрубрик).
 * События открытия / закрытия.
 * ========================================================================== */
$(document).on('show.bs.dropdown', '.dropdown-rubrics', function () {
    $('.dropdown-rubrics_link').html('<span class="icon-direction266 icon"></span>&nbsp;Скрыть');
});
$(document).on('hide.bs.dropdown', '.dropdown-rubrics', function () {
    $('.dropdown-rubrics_link').html('Выбрать рубрики&nbsp;<span class="icon-keyboard53 icon"></span>');
});

/* ==========================================================================
 * Очистка (снятие статуса checked) с категорий.
 * ========================================================================== */
$(document).on('click', '#clear-categories', function (e) {
    e.preventDefault();
    form.find('input[name^="category"]').prop('checked', false);
    $('#subcategory-container').empty();
});

/* ==========================================================================
 * Очистка (снятие статуса checked) с подкатегорий.
 * ========================================================================== */
$(document).on('click', '#clear-subcategories', function (e) {
    e.preventDefault();
    form.find('input[name^="subcategory"]').prop('checked', false);
});

/* ==========================================================================
 * Обработка клика по кнопке "Применить" в окне дропдаун (список категорий / подкатегорий).
 * ========================================================================== */
$(document).on('click', '#change-category', function (e) {
    e.preventDefault();
    $('#category-dropdown').dropdown('toggle');
    form.trigger('submit');
});

/* ==========================================================================
 * Закрытие окна дропдауна (список категорий / подкатегорий). Событие на иконке крестика.
 * ========================================================================== */
$(document).on('click', 'button.close', function () {
    $('#category-dropdown').dropdown('toggle');
});

/* ==========================================================================
 * Обработчики pjax-событий (start and end) переключающие переменную [[status]].
 * Срабатывают когда сабмитится форма.
 * ========================================================================== */
$(document).on('pjax:start', searchContainerTag, function (xhr, options) {
    if ($(xhr.relatedTarget).closest('.pagination').length) {
        return;
    }
    let $container = $(searchContainerTag);
    $container.css({'min-height': '120px', 'position': 'relative'}).empty();
    spinner.spin($container[0]);
    form.find('input[type="text"], input[type="checkbox"], select, button').prop('disabled', true);
    status = false;
});
$(document).on('pjax:end', searchContainerTag, function (xhr, options) {
    if ($(xhr.relatedTarget).closest('.pagination').length) {
        return;
    }
    let $container = $(searchContainerTag);
    $container.css('min-height', 'auto');
    form.find('input[type="text"], input[type="checkbox"], select, button').prop('disabled', false);
    status = true;
});

/* ==========================================================================
 * Обработка события открытия / закрытия "аккордеона". Изменяю кнопку "Больше / Меньше".
 * ========================================================================== */
$(document).on('hide.bs.collapse', '#form-search-collapse', function () {
    $('#form-search-collapse-more').removeClass('hide');
    $('#form-search-collapse-less').addClass('hide');
});
$(document).on('show.bs.collapse', '#form-search-collapse', function () {
    $('#form-search-collapse-less').removeClass('hide');
    $('#form-search-collapse-more').addClass('hide');
});

/* ==========================================================================
 * Обработка выбора в селекте регионов, открываю список станций метро.
 * ========================================================================== */
$(document).on('change', '.select-region', function () {
    let $this = $(this);
    let value = +$this.val();
    let $subwayWrapper = $(this).closest('.form-wrap').next('.form-wrap-subway');
    if (value > 30 && value < 51 || value === 2) {
        $subwayWrapper.removeClass('hide');
    } else {
        $subwayWrapper.addClass('hide');
        $subwayWrapper.find('select').val(0).trigger('change');
    }
});

/* ==========================================================================
 * Обработка выбора в селекте метро, открываю список расстояние от метро.
 * ========================================================================== */
$(document).on('change', '.select-subway', function () {
    let $this = $(this);
    let value = +$this.val();
    let $fromSubwayWrapper = $(this).closest('.form-wrap').next('.form-wrap-from-subway');
    if (value > 0) {
        $fromSubwayWrapper.removeClass('hide');
    } else {
        $fromSubwayWrapper.addClass('hide');
        $fromSubwayWrapper.find('select').val(0).trigger('change');
    }
});

/* ==========================================================================
 * Переключение параметра сортировки.
 * ========================================================================== */
$(document).on('click', '#sort-variants a', function (e) {
    e.preventDefault();
    if (mobileForm.is(':visible')) {
        mobileForm.find('.search-form-sort').val($(this).data('id'));
        mobileForm.trigger('submit');
    } else {
        form.find('.search-form-sort').val($(this).data('id'));
        form.trigger('submit');
    }
});

/* ==========================================================================
 * Открытие списка категорий и подкатегорий при клике на ссылке "Еще".
 * ========================================================================== */
$(document).on('click', '.more-categories', function(event) {
    event.preventDefault();
    event.stopPropagation();
    if ($(this).closest('form').attr('id') === mobileFormTag.replace('#', '')) {
        $(this).closest('.dropdown-rubrics').find('.next-screen').trigger('click');
    } else {
        $('#category-dropdown').dropdown('toggle');
    }
});

/* ==========================================================================
 * Переключение вперед/назад пагинатора с помощью ctrl + стрелка вперед/назад.
 * ========================================================================== */
$(document).on('keypress', function (event) {
    if (event.keyCode === 37 && event.ctrlKey) {
        $('.main-pagination .prev a').trigger('click');
    } else if (event.keyCode === 39 && event.ctrlKey) {
        $('.main-pagination .next a').trigger('click');
    }
});

/* ==========================================================================
 * Мобильный поиск.
 * ========================================================================== */

/* ==========================================================================
 * Обработка события resize. Отображение или скрытие моб. поиска.
 * ========================================================================== */
(function () {
    let oldWidth = $(window).width();
    $(window).resize(function () {
        let width = $(window).width();
        if (oldWidth === width) {
            return;
        } else {
            oldWidth = width;
        }
        if (width > 991) {
            $('#search-results').removeClass('hide');
        } else {
            closeMobileSearch();
        }
    });
})();

/**
 * Открытие моб. поиска.
 */
function openMobileSearch() {
    $('#search-results').addClass('hide');
    $('.extended-search').removeClass('hide');
    $('.search-mobile__row').addClass('hide');
}

/**
 * Скрытие моб. поиска.
 */
function closeMobileSearch() {
    $('#search-results').removeClass('hide');
    $('.extended-search').addClass('hide');
    $('.search-mobile__row').removeClass('hide');
}

/* ==========================================================================
 * Обработка клика отвечающего за открытие моб. поиска.
 * ========================================================================== */
$(document).on('click', '.extended-search-link', function (event) {
    if (event.target.tagName.toLowerCase() === 'a') {
        event.preventDefault();
        event.stopPropagation();
    }
    openMobileSearch();
});

/* ==========================================================================
 * Следующий скрин моб. поиска. Это переход к списку рубрик или подрубрик.
 * ========================================================================== */
$(document).on('click', '.next-screen', function (event) {
    event.preventDefault();
    event.stopPropagation();
    let $this = $(this);
    let $currentScreen = $(this).closest('.mobile-search-screen');
    let id = $this.data('id');
    let $element = id ? $currentScreen.nextAll(`[data-id="${id}"]`) : $currentScreen.next();

    $currentScreen.css('right', '125%');
    $element.animate({
        'right': 0
    }, 0, function () {
        $(this).addClass('active');
    });
    $currentScreen.removeClass('active');
    $('html, body').scrollTop(0);
});

/* ==========================================================================
 * Предыдущий скрин моб. поиска. Это переход к списку рубрик или полям формы.
 * ========================================================================== */
$(document).on('click', '.prev-screen', function (event) {
    event.preventDefault();
    event.stopPropagation();
    let $this = $(this);
    let $currentScreen = $this.closest('.mobile-search-screen');
    let id = $this.data('id');
    let $element = id ? $currentScreen.prevAll(`[data-id="${id}"]`) : $currentScreen.prev();

    $currentScreen.css('right', '-125%');
    $element.animate({
        'right': 0
    }, 0, function () {
        $(this).addClass('active');
    });
    $currentScreen.removeClass('active');
    $('html, body').scrollTop(0);
});

/* ==========================================================================
 * Обработчик слушает событие на чекбоксе "Все рубрики", и выбирает все чекбоксы
 * подрубрик или снимает выбор с этих чекбоксов.
 * ========================================================================== */
$(document).on('change', '.mobile-checked-subcategories', function () {
    let $this = $(this);
    $this.closest('li')
        .nextAll()
        .find('[type="checkbox"]')
        .prop('checked', $this.prop('checked'))
        .trigger('change');
});

/* ==========================================================================
 * Обработчик слушает событие на чекбоксе "очистить все подрубрики",
 * снимает выбор с чекбоксов подрубрик.
 * ========================================================================== */
$(document).on('click', '.mobile-unchecked-subcategories', function (event) {
    event.preventDefault();
    $(this).closest('.mobile-search-screen')
        .find('.list-checkbox [type="checkbox"]')
        .prop('checked', false)
        .trigger('change');
});

/* ==========================================================================
 * Обработчик слушает событие на чекбоксе "очистить все рубрики",
 * снимает выбор со скрытых чекбоксов рубрик.
 * ========================================================================== */
$(document).on('click', '.mobile-unchecked-categories', function (event) {
    event.preventDefault();
    let $form = $(this).closest('form');
    $form.find('[name^="category"], [name^="subcategory"], .mobile-checked-subcategories')
        .prop('checked', false);
    $form.find('[data-id="root-categories"] li').removeClass('active');
    updateSelectedCategories($form);
    $('html, body').scrollTop(0);
});

/* ==========================================================================
 * Обрабатывается выбор подрубрик чекбоксов и перерисовыется html для выбранных
 * рубрик / подрубрик. Затрагивается и десктопная версия.
 * ========================================================================== */
$(document).on('change', '.list-checkbox [type="checkbox"]', function (event) {
    let $this = $(this);
    let checked = $this.prop('checked');
    let id = $this.closest('.mobile-search-screen').data('id');
    let $parent = $('.mobile-search-screen[data-id="root-categories"]')
        .find(`a[data-id=${id}]`)
        .closest('li');

    if (!checked) {
        $this.closest('.list-checkbox')
            .find('[type="checkbox"]')
            .each(function () {
                if ($(this).prop('checked')) {
                    checked = true;
                }
            });
    }

    checked ? $parent.addClass('active') : $parent.removeClass('active');
    $parent.find('[type="checkbox"]').prop('checked', checked);
    updateSelectedCategories($this.closest('form'));
});

/* ==========================================================================
 * Обрабатывается ввод текста в поля "Ключевые слова". Одно поле отображается
 * когда рассширенный поиск скрыт, а второе когда рассширенный поиск активирован.
 * Поля просто синхронизируют свои значения.
 * ========================================================================== */
$(document).on('keyup', `${mobileFormTag} .single-keyword-input, ${mobileFormTag} .not-single-keyword-input`, function () {
    let $this = $(this);
    let value = $this.val();
    if ($this.hasClass('single-keyword-input')) {
        $(`${mobileFormTag} .not-single-keyword-input`).val(value);
    } else {
        $(`${mobileFormTag} .single-keyword-input`).val(value);
    }
});

/* ==========================================================================
 * Здесь происходит установка или удаление выбора на срытых чекбоксах рубрик.
 * А также переход на первый экран, к остальным полям формы.
 * ========================================================================== */
$(document).on('click', 'a[data-id="first-screen"]', function () {
    let $li = $(this).closest('li');
    let $checkbox = $li.find('[type="checkbox"]');
    let checked = $checkbox.prop('checked');
    $checkbox.prop('checked', !checked);
    checked ? $li.removeClass('active') : $li.addClass('active');
    updateSelectedCategories($checkbox.closest('form'));
});
