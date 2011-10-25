/*
    genericadmin - Weston Nielson (wnielson@gmail.com)

    updated by Jan Schrewe (jschrewe@googlemail.com)

 */

(function ($) {
	var GenericAdmin = {
			url_array: null,
			loadUrlArray: function() {
				var that = this;
				this.url_array = {};
				$.each(MODEL_URL_ARRAY, function(key, value) {
					that.url_array[key] = value['app'] + '/' + value['model'];
				});
			},
			prepareSelect: function() {
				var that = this;
				var opt_keys = [];
				var opt_dict = {};
				var contentTypeSelect;

				// should return 3 items: ["id_ingredientlist_set", "2",
				// "content_type"]
				contentTypeSelect = $('#id_content_type').first();
				var vars = $(this.object_input).attr("id").split('-');
				if (vars.length !== 1) { 
					contentTypeSelect = $('#' + vars[0] + '-' + vars[1] + '-content_type').first();
				}

				// polish the look of the select
				$(contentTypeSelect).find('option').each(function() {
					var key;
					if (this.value) {
						key = that.url_array[this.value].split('/')[0];
						// create an array with unique elements
						if ($.inArray(key, opt_keys) < 0) {
							opt_keys.push(key);
							// if it's the first time in array
							// it's the first time in dict
							opt_dict[key] = [$(this).clone()];
						} else {
							opt_dict[key].push($(this).clone());
						}
						$(this).remove();
					}
				});

				opt_keys = opt_keys.sort();
				
				var opt_group_css = 'style="font-style:normal; font-weight:bold; color:#999; padding-left: 2px;"';
				$.each(opt_keys, function(index, key) {
					var opt_group = $('<optgroup label="' + key + '" ' + opt_group_css + '></optgroup>');
					$.each(opt_dict[key], function (index, value) {
						opt_group.append(value).css({'color': '#000', 'font-weight': 'normal'});
					});
					$(contentTypeSelect).append(opt_group);
				});

				return contentTypeSelect;
			},
			installAdmin: function(elem) {
				var that = this;
				// initialize the url array
				this.loadUrlArray();
				// store the base element
				this.object_input = elem;
				// find the select we need to change
				contentTypeSelect = this.prepareSelect();
			}, 	
	};

	$(document).ready(function() {	
		$("[id$='object_id']").each(function(i, e) {
			GenericAdmin.installAdmin(this);
		});
	});
}(django.jQuery));