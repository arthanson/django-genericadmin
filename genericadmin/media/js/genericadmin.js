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
			// we define that here because we want to keep
			// the prototype as clean as possible
			arrayUnique: function(arr) {
				var a = [];
				var l = arr.length;
				for(var i=0; i<l; i++) {
					for(var j=i+1; j<l; j++) {
						// If this[i] is found later in the array
						if (arr[i] === arr[j]) {
							j = ++i;
						}
					}
					a.push(arr[i]);
				}
				return a;
			},
			prepareSelect: function() {
				var that = this;
				var opt_keys = [];
				var opt_dict = {};
				var key;
				var active = false;
				var vars;
				var id;
				var contentTypeSelect;
				var to_insert;
				var i;
				var opt_group;
				var option;

				// should return 3 items: ["id_ingredientlist_set", "2",
				// "content_type"]
				vars = $(this.object_input).attr("id").split('-');
				if (vars.length == 1) { // not an inline edit
					id = '#id_content_type';
				} else {
					id = '#' + vars[0] + '-' + vars[1] + '-content_type';
				}
				contentTypeSelect = $(id)[0];

				// polish the look of the select
				$(contentTypeSelect).find('option').each(function() {
					if (this.value) {
						key = that.url_array[this.value].split('/')[0];
						opt_keys.push(key);
						to_insert = {
								"elem": this,
								"color": $(this).css('color'),
								"padding": $(this).css('padding')
						}
						if (!opt_dict[key]) {
							opt_dict[key] = [to_insert];
						} else {
							opt_dict[key].push(to_insert);
						}
						$(this).remove();
					}
				});

				opt_keys = this.arrayUnique(opt_keys);
				opt_keys = opt_keys.sort();

				for (i = 0; i < opt_keys.length; i++) {
					key = opt_keys[i];
					opt_group = $('<optgroup label="' + key + '"></optgroup>').css({
						"font-style": "normal",
						"font-weight": "bold", 
						"color": "#999",
						"padding-left": "2px"
					});
					$(contentTypeSelect).append(opt_group);

					for (j in opt_dict[key]) {
						option = opt_dict[key][j]["elem"];
						$(option).css({'color': opt_dict[key][j]["color"], 'padding': opt_dict[key][j]["padding"]});
						opt_group.append(option);
					}
				}

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
				var win = window;
				var that = this;
				var delay = 150
				var interval_id;
				var timer = function () {
					if (win.closed == true) {
						clearInterval(interval_id);
						that.updateObjectData()();
						return true;
					}
				}
				interval_id = setInterval(timer, delay);
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
					$('#lookup_text').text('');
					$('#lookup_text').text('loading...');
					$.ajax({
						url: that.obj_url,
						dataType: 'json',
						data: {object_id: that.object_input.value, content_type: that.cID},
						success: function(data) {
							var item = data[0];
							$('#lookup_text').text(item.content_type_text + ': ' + item.object_text);
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

				// Bind to the onfocus of the window and the onblur of the
				// object_id input.
				$(this.object_input).blur(this.updateObjectData());
			}, 	
	};

	$(document).ready(function() {	
		$("[id$='object_id']").each(function(i, e) {
			GenericAdmin.installAdmin(this);
		});
	});
}(django.jQuery));