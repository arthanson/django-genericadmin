/*
    genericadmin - Weston Nielson (wnielson@gmail.com)

    updated by Jan Schrewe (jschrewe@googlemail.com)

    updated by Troy Melhase (troy.melhase@gmail.com)

    updated by Jonathan Ellenberger (jon@respondcreate.com)

 */
 (function($) {
    var GenericAdmin = {
        url_array: null,
        fields: null,
        obj_url: "../obj-data/",
        admin_media_url: window.__admin_media_prefix__,
        
        prepareSelect: function(select) {
            var that = this,
                opt_keys = [],
                opt_dict = {},
                opt_group_css = 'style="font-style:normal; font-weight:bold; color:#999; padding-left: 2px;"';

            // polish the look of the select
            select.find('option').each(function() {
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

            $.each(opt_keys, function(index, key) {
                var opt_group = $('<optgroup label="' + key + '" ' + opt_group_css + '></optgroup>');
                $.each(opt_dict[key], function(index, value) {
                    opt_group.append(value).css({
                        'color': '#000'
                    });
                });
                select.append(opt_group);
            });

            return select;
        },

        getLookupUrlParams: function(cID) {
            var q = this.url_array[cID][1] || {}, 
                str = [];
            for(var p in q) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(q[p]));
            }
            x = str.join("&");
            url = x ? ("?" + x) : "";
            return url;
        },
        
        getLookupUrl: function(cID) {
            return '../../../' + this.url_array[cID][0] + '/' + this.getLookupUrlParams(cID);
        },
        
        getFkId: function() {
            return 'id_' + this.fields.fk_field;
        },
        
        getCtId: function() {
            return 'id_' + this.fields.ct_field;
        },
        
        hideLookupLink: function() {
            var this_id = this.getFkId();
            $('#lookup_' + this_id).unbind().remove();
            $('#lookup_text_' + this_id + ' a').text('');
            $('#lookup_text_' + this_id + ' span').text('');
        },
        
        showLookupLink: function() {
            var that = this,
                url = this.getLookupUrl(this.cID),
                this_id = this.getFkId(),
                id = 'lookup_' + this_id,
                link = '<a class="related-lookup" id="' + id + '" href="' + url + '">';
                
            link = link + '<img src="' + this.admin_media_url + 'img/selector-search.gif" style="cursor: pointer; margin-left: 5px; margin-right: 10px;" width="16" height="16" alt="Lookup"></a>';
            link = link + '<strong id="lookup_text_'+ this_id +'" margin-left: 5px"><a target="_new" href="#"></a><span></span></strong>';

            // insert link html after input element
            this.object_input.after(link);

            return id;
        },
        
        pollInputChange: function(window) {
            var that = this,
                interval_id = setInterval(function() {
                    if (window.closed === true) {
                        clearInterval(interval_id);
                        that.updateObjectData()();
                        return true;
                    }
                },
                150);
        },
        
        popRelatedObjectLookup: function(link) {
            var name = id_to_windowname(this.getFkId()), 
                href, 
                win;

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
                var value = that.object_input.attr('value');
                
                if (!value) { 
                    return 
                }
                var this_id = that.getFkId();
                $('#lookup_text_' + this_id + ' span').text('loading...');
                $.ajax({
                    url: that.obj_url,
                    dataType: 'json',
                    data: {
                        object_id: value,
                        content_type: that.cID
                    },
                    success: function(item) {
                        if (item && item.content_type_text && item.object_text) {
                            var url = that.getLookupUrl(that.cID);
                            $('#lookup_text_' + this_id + ' span').text('');
                            $('#lookup_text_' + this_id + ' a')
                                .text(item.content_type_text + ': ' + item.object_text)
                                .attr('href', url + item.object_id);

                            // run a callback to do other stuff like prepopulating url fields
                            // can't be done with normal django admin prepopulate
                            if (that.updateObjectDataCallback) {
                                that.updateObjectDataCallback(item);
                            }
                        } else {
                            $('#lookup_text_' + this_id + ' span').text('');
                        }
                    }
                });
            };
        },

        installAdmin: function(fields, url_array) {
            var that = this;

            this.url_array = url_array;
            this.fields = fields;
            
            // store the base element
            this.object_input = $("#" + this.getFkId());
            
            // find the select we need to change
            this.object_select = this.prepareSelect($("#" + this.getCtId()));

            // install event handler for select
            this.object_select.change(function() {
                // reset the object input to the associated select (this one)
                var link_id;

                //(this).css('color', 'red'); // uncomment for testing
                that.hideLookupLink();
                // Set our objectId when the content_type is changed
                if (this.value) {
                    that.cID = this.value;
                    link_id = that.showLookupLink();
                    $('#' + link_id).click(function(e) {
                        e.preventDefault()
                        that.popRelatedObjectLookup(this);
                    });
                }
            });

            // fire change event if something is already selected
            if (this.object_select.val()) {
                this.object_select.trigger('change');
            }

            // Bind to the onblur of the object_id input.
            this.object_input.blur(that.updateObjectData());

            // Fire once for initial link.
            this.updateObjectData()();
        }
    };

    $(document).ready(function() {
        $.ajax({
            url: '../genericadmin-init/',
            dataType: 'json',
            success: function(data) {
                var url_array = data.url_array,
                    ct_fields = data.fields;
                for (var i = 0; i < ct_fields.length; i++) {
                    $.extend({}, GenericAdmin).installAdmin(ct_fields[i], url_array);
                }
            }
        });
    });
} (django.jQuery));
