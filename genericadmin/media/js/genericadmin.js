/*
    genericadmin - Weston Nielson (wnielson@gmail.com)

    updated by Jan Schrewe (jschrewe@googlemail.com)

 */

(function ($) {
	var GenericAdmin = {
			url_array: null,
			obj_url: "../obj/",
			admin_media_url: window.__admin_media_prefix__,
			generics_list_url: '../get-generic-rel-list/',
			loadUrlArray: function() {
				var that = this;
				$.ajax({
					url: this.generics_list_url,
					dataType: 'json',
					success: function(data) {
						that.url_array = data;
					},
					async: false
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
						opt_group.append(value).css({'color': '#000'});
					});
					$(contentTypeSelect).append(opt_group);
				});

				return contentTypeSelect;
			},
			getLookupUrl: function (cID) {
				return '../../../' + this.url_array[cID] + '/';
			},
			hideLookupLink: function() {
				$('#lookup_' + this.object_input.id).unbind().remove();
				$('#lookup_text').remove();
			},
			showLookupLink: function () {		
				var that = this;
				var url = this.getLookupUrl(this.cID);
				var id = 'lookup_' + this.object_input.id;

				var link = '<a class="related-lookup" id="' + id + '" href="' + url + '">';
				link = link + '<img src="' + this.admin_media_url + 'img/admin/selector-search.gif" style="cursor: pointer; margin-left: 5px; margin-right: 10px;" width="16" height="16" alt="Lookup"></a>';
				link = link + '<strong id="lookup_text" margin-left: 5px"></strong>'

				// insert link html after input element
				$(this.object_input).after(link);

				return id;
			},
			pollInputChange: function (window) {
				var that = this;
				var interval_id = setInterval(function () {
					if (window.closed == true) {
						clearInterval(interval_id);
						that.updateObjectData()();
						return true;
					}
				}, 150);
			},
			popRelatedObjectLookup: function(link) {
				var name = link.id.replace(/^lookup_/, '');
				var href;
				var win;

				name = id_to_windowname(name);

				if (link.href.search(/\?/) >= 0) {
					href = link.href + '&pop=1';
				} else {
					href = link.href + '?pop=1';
				}
				win = window.open(href, name, 'height=500,width=800,resizable=yes,scrollbars=yes');

				// wait for popup to be closed and load object data
				this.pollInputChange(win);

				win.focus();
				return false;
			},
			updateObjectData: function() {
				var that = this;
				return function () {
					$('#lookup_text').text('').text('loading...');
					$.ajax({
						url: that.obj_url,
						dataType: 'json',
						data: {object_id: that.object_input.value, content_type: that.cID},
						success: function(data) {
							var item = data[0];
							if (item && item.content_type_text && item.object_text) {
								$('#lookup_text').text(item.content_type_text + ': ' + item.object_text);
								// run a callback to do other stuff like prepopulating url fields
								// can't be done with normal django admin prepopulate
								if (that.updateObjectDataCallback) {
									that.updateObjectDataCallback(item);
								}
							}
						}
					});
				};
			},
			installAdmin: function(elem) {
				var that = this;
				// initialize the url array
				this.loadUrlArray();
				// store the base element
				this.object_input = elem;
				// find the select we need to change
				contentTypeSelect = this.prepareSelect();
				
				// install event handler for select
				$(contentTypeSelect).change(function() {
					var link_id;
					that.hideLookupLink();
					// Set our objectId when the content_type is changed
					if (this.value) {
						that.cID = this.value;
						link_id = that.showLookupLink();
						$('#' + link_id).click(function (e) {
							that.popRelatedObjectLookup(this);
							return false;
						});
					}
				});
				
				// fire change event if something is already selected
				if ($(contentTypeSelect).val()) {
					$(contentTypeSelect).trigger('change');
				}
				
				// Bind to the onblur of the object_id input.
				$(this.object_input).blur(this.updateObjectData());
			}, 	
	};

	$(document).ready(function() {	
		$("[id$='object_id']").each(function(i, e) {
			GenericAdmin.installAdmin(this);
		});
	});
}(django.jQuery));