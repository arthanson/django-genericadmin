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
                no_value,
                opt_group_css = 'style="font-style:normal; font-weight:bold; color:#999; padding-left: 2px;"';

            // polish the look of the select
            select.find('option').each(function() {
                var key, opt;

                if (this.value) {
                    if (that.url_array[this.value]) {
                        key = that.url_array[this.value][0].split('/')[0];
                        
                        opt = $(this).clone();
                        opt.text(that.capFirst(opt.text()));
                        if ($.inArray(key, opt_keys) < 0) {
                            opt_keys.push(key);
                            // if it's the first time in array
                            // it's the first time in dict
                            opt_dict[key] = [opt];
                        } else {
                            opt_dict[key].push(opt);
                        }
                    }
                } else {
                    no_value = $(this).clone();
                }
            });
            select.empty().append(no_value);
            
            opt_keys = opt_keys.sort();

            $.each(opt_keys, function(index, key) {
                var opt_group = $('<optgroup label="' + that.capFirst(key) + '" ' + opt_group_css + '></optgroup>');
                $.each(opt_dict[key], function(index, value) {
                    opt_group.append(value).css('color', '#000');
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
            if (this.fields.inline === false) {
                return 'id_' + this.fields.fk_field;
            } else {
                return ['id_', this.fields.prefix, '-', this.fields.number, '-', this.fields.fk_field].join('');
            }
        },
        
        getCtId: function() {
            if (this.fields.inline === false) {
                return 'id_' + this.fields.ct_field;
            } else {
                return ['id_', this.fields.prefix, '-', this.fields.number, '-', this.fields.ct_field].join('');
            }
        },
        
        capFirst: function(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        
        hideLookupLink: function() {
            var this_id = this.getFkId();
            $('#lookup_' + this_id).unbind().remove();
            $('#lookup_text_' + this_id + ' a').remove();
            $('#lookup_text_' + this_id + ' span').remove();
        },
        
        showLookupLink: function() {
            var that = this,
                url = this.getLookupUrl(this.cID),
                id = 'lookup_' + this.getFkId(),
                link = '<a class="related-lookup" id="' + id + '" href="' + url + '">';
                
            link = link + '<img src="' + this.admin_media_url + 'img/selector-search.gif" style="cursor: pointer; margin-left: 5px; margin-right: 10px;" width="16" height="16" alt="Lookup"></a>';
            link = link + '<strong id="lookup_text_'+ this.getFkId() +'" margin-left: 5px"><a target="_new" href="#"></a><span></span></strong>';

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
                var value = that.object_input.val();
                
                if (!value) { 
                    return 
                }
                //var this_id = that.getFkId();
                $('#lookup_text_' + that.getFkId() + ' span').text('loading...');
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
                            $('#lookup_text_' + that.getFkId() + ' a')
                                .text(item.content_type_text + ': ' + item.object_text)
                                .attr('href', url + item.object_id);

                            // run a callback to do other stuff like prepopulating url fields
                            // can't be done with normal django admin prepopulate
                            if (that.updateObjectDataCallback) {
                                that.updateObjectDataCallback(item);
                            }
                        }
                        $('#lookup_text_' + that.getFkId() + ' span').text('');
                    },
                    error: function(xhr, status, error) {
                        $('#lookup_text_' + that.getFkId() + ' span').text('')
                            .html('Error: ' + xhr.status + ' &ndash; ' + that.capFirst(xhr.statusText.toLowerCase()));
                        if (xhr.status === 404) {
                            that.object_input.val('');
                        } else {
                            $('#lookup_text_' + that.getFkId() + ' span').css('color', '#f00');
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
                        e.preventDefault();
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
                    ct_fields = data.fields,
                    fields,
                    inline_count,
                    install_inline,
                    f,
                    click_closure = function (field_obj) {
                        $('#' + field_obj.prefix + '-group .add-row a').click(function (e) {
                            e.preventDefault();
                            var added_fields = $.extend({}, field_obj);
                            added_fields.number = ($('#id_' + fields.prefix + '-TOTAL_FORMS').val() - 1);
                            $.extend({}, GenericAdmin).installAdmin(added_fields, url_array);
                        });
                    };
                for (var i = 0; i < ct_fields.length; i++) {
                    fields = ct_fields[i];
                    if (fields.inline === false) {
                        $.extend({}, GenericAdmin).installAdmin(fields, url_array);
                    } else {
                        inline_count = $('#id_' + fields.prefix + '-TOTAL_FORMS').val();
                        for (var j = 0; j < inline_count; j++) {
                            f = $.extend({}, fields);
                            f.number = j;
                            $.extend({}, GenericAdmin).installAdmin(f, url_array);
                        }
                        click_closure(fields);
                    }
                }
            }
        });
    });
} (django.jQuery));
