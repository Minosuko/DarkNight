function initCustomSelects(force = false) {
    // Support various select classes
    $('.premium-select, .setting-select, .premium-select-sm, .index_input_box, .modal-privacy-select, .custom-select, .tos-select').each(function () {
        if (!$(this).is('select')) return; // Only target actual selects
        const $this = $(this);
        if ($this.next('.custom-select-container').length > 0) {
            if (force) $this.next('.custom-select-container').remove();
            else return; // Already initialized
        }

        const options = $this.find('option');
        const selectedOption = $this.find('option:selected');

        const container = $('<div class="custom-select-container"></div>');
        const trigger = $('<div class="custom-select-trigger"><span>' + selectedOption.text() + '</span><i class="fa-solid fa-chevron-down"></i></div>');
        const dropdown = $('<div class="custom-select-dropdown"></div>');

        options.each(function () {
            const $opt = $(this);
            const optUI = $('<div class="custom-select-option" data-value="' + $opt.val() + '">' + $opt.text() + '</div>');
            if ($opt.is(':selected')) optUI.addClass('selected');

            optUI.on('click', function (e) {
                e.stopPropagation();
                container.find('.custom-select-option').removeClass('selected');
                $(this).addClass('selected');
                trigger.find('span').text($(this).text());
                $this.val($(this).data('value')).trigger('change');
                container.removeClass('open');
            });

            dropdown.append(optUI);
        });

        trigger.on('click', function (e) {
            e.stopPropagation();
            // Close other selects
            $('.custom-select-container').not(container).removeClass('open');
            // Close post options
            if ($('.post-options-menu').length > 0) {
                $('.post-options-menu').removeClass('active');
            }
            container.toggleClass('open');
        });

        container.append(trigger).append(dropdown);
        $this.after(container);
        $this.hide();

        // Special case for search page: hide the old manual chevron if it exists in the wrapper
        $this.siblings('.select-icon').hide();
    });
}

// Close dropdowns on outside click
$(document).on('click', function () {
    $('.custom-select-container').removeClass('open');
});
