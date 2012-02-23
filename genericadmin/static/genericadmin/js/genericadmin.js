/*
    genericadmin - Weston Nielson (wnielson@gmail.com)

    updated by Jan Schrewe (jschrewe@googlemail.com)

    updated by Troy Melhase (troy.melhase@gmail.com)

 */
 (function($) {
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
        prepareSelect: function(elem) {
            var that = this;
            var opt_keys = [];
            var opt_dict = {};
            var contentTypeSelect;
            var outstring = '';
            
            // should return 3 items: ["id_ingredientlist_set", "2",
            // "content_type"]
            // FIX:  a better way to specify this for generic inlines
            var context = $(elem).parents('fieldset');
            contentTypeSelect = $("[id$='content_type']", context).first();
            // contentTypeSelect = $('#id_content_type').first();
            var vars = $(this.object_input).attr("id").split('-');
            for (var x = 0; x < (vars.length-1); x++){
                outstring+=vars[x]+'-'
            }
            contentTypeSelect = $('#' + outstring + 'content_type').first();

            // polish the look of the select
            $(contentTypeSelect).find('option').each(function() {
                var key;

                if (this.value) {
                    if (that.url_array[this.value]) {
                        key = that.url_array[this.value][0].split('/')[0];
                        // create an array with unique elements
                        if ($.inArray(key, opt_keys) < 0) {
                            opt_keys.push(key);
                            // if it's the first time in array
                            // it's the first time in dict
                            opt_dict[key] = [$(this).clone()];
                        } else {
                            opt_dict[key].push($(this).clone());
                        }
                    }
                    $(this).remove();
                }
            });

            opt_keys = opt_keys.sort();

            var opt_group_css = 'style="font-style:normal; font-weight:bold; color:#999; padding-left: 2px;"';
            $.each(opt_keys, function(index, key) {
                var opt_group = $('<optgroup label="' + key + '" ' + opt_group_css + '></optgroup>');
                $.each(opt_dict[key], function(index, value) {
                    opt_group.append(value).css({
                        'color': '#000'
                    });
                });
                $(contentTypeSelect).append(opt_group);
            });

            return contentTypeSelect;
        },

        getLookupUrlParams: function(cID) {
            var q = this.url_array[cID][1] || {};
            var str = [];
            for(var p in q)
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(q[p]));
            x = str.join("&");
            url = x ? ("?" + x) : "";
            return url
        },
        getLookupUrl: function(cID) {
            return '../../../' + this.url_array[cID][0] + '/' + this.getLookupUrlParams(cID);
        },
        hideLookupLink: function() {
            var this_id = this.object_input.attr('id');
            $('#lookup_' + this_id).unbind().remove();
            $('#lookup_text_' + this_id).remove();
        },
        showLookupLink: function() {
            var that = this;
            var url = this.getLookupUrl(this.cID);
            var this_id = this.object_input.attr('id');
            var id = 'lookup_' + this_id;

            var link = '<a class="related-lookup" id="' + id + '" href="' + url + '">';
            link = link + '<img src="' + this.admin_media_url + 'img/admin/selector-search.gif" style="cursor: pointer; margin-left: 5px; margin-right: 10px;" width="16" height="16" alt="Lookup"></a>';
            link = link + '<strong id="lookup_text_'+ this_id +'" margin-left: 5px"></strong>';

            // insert link html after input element
            $(this.object_input).after(link);

            return id;
        },
        pollInputChange: function(window) {
            var that = this;
            var interval_id = setInterval(function() {
                if (window.closed == true) {
                    clearInterval(interval_id);
                    that.updateObjectData()();
                    return true;
                }
            },
            150);
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
            return function() {
                // if (!that.object_input.value) { return } 
                // bail if no input
                var this_id = that.object_input.attr('id');
                $('#lookup_text_'+this_id).text('').text('loading...');
                $.ajax({
                    url: that.obj_url,
                    dataType: 'json',
                    data: {
                        object_id: that.object_input.attr('value'),
                        content_type: that.cID
                    },
                    success: function(data) {
                        var item = data[0];
                        if (item && item.content_type_text && item.object_text) {
                            $('#lookup_text_'+this_id).text(item.content_type_text + ': ' + item.object_text);
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
            that.loadUrlArray();
            // store the base element
            that.object_input = elem;

            // find the select we need to change
            that.object_select = that.prepareSelect(elem);

            // install event handler for select
            $(that.object_select).change(function() {
                // reset the object input to the associated select (this one)
                that.object_input = $('#' + this.id.replace('-content_type', '-object_id'));
                
                //(this).css('color', 'red'); // uncomment for testing
                var link_id;
                that.hideLookupLink();
                // Set our objectId when the content_type is changed
                if (this.value) {
                    that.cID = this.value;
                    link_id = that.showLookupLink();
                    $('#' + link_id).click(function(e) {
                        that.popRelatedObjectLookup(this);
                        return false;
                    });
                }
            });

            // fire change event if something is already selected
            if ($(this.object_select).val()) {
                $(this.object_select).trigger('change');
            }

            // Bind to the onblur of the object_id input.
            $(this.object_input).blur(this.updateObjectData());
        },
    };



    $(document).ready(function() {
        $("[id$='object_id']").each(function(i, e) {
            $.extend({}, GenericAdmin).installAdmin(this);
        });
    });
} (django.jQuery));
