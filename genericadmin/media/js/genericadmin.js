/*
    genericadmin - Weston Nielson (wnielson@gmail.com)
    
    updated by Jan Schrewe (jschrewe@googlemail.com)
    
*/

var GenericAdmin = {
	url_array: null,
	obj_url: "../obj/",
	admin_media_url = window.__admin_media_prefix__,
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
	showRelatedObjectLookupPopup: function(triggeringLink) {
        // A copy of Django's showRelatedObjectLookupPopup, but we need to capture the window.onunload
        
		var name = triggeringLink.id.replace(/^lookup_/, '');
	    name = id_to_windowname(name);
	    var href;
	    if (triggeringLink.href.search(/\?/) >= 0) {
	        href = triggeringLink.href + '&pop=1';
	    } else {
	        href = triggeringLink.href + '?pop=1';
	    }
	    var win = window.open(href, name, 'height=500,width=800,resizable=yes,scrollbars=yes');
	    
        $(win).bind('beforeunload', function() {
            // This complicated guy is needed becase when the window is 'unloaded' the value selected isn't
            // inserted in the object_id field quite yet, so we set a small delay--setTimeout is a pain...
            function timedReset(me) {
                var me = me;
                this.update = function(){
                    me.updateObjectIdEl();
                };
                this.go = function() {
                    setTimeout(this.update, 200);
                }
            };
            updater = new timedReset(self);
            updater.go();
        });
        
        win.focus();
        return false;
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
		// save for later
		var that = this;
		// should return 3 items: ["id_ingredientlist_set", "2", "content_type"]
		vars = $(this.elem).attr("id").split('-');
		if (vars.length == 1) { //not an inline edit
            id = '#id_content_type';
        } else {
            id = '#' + vars[0] + '-' + vars[1] + '-content_type';
        }
        var contentTypeSelect = $(id)[0];
        
        // polish the look of the select
        var opt_keys = [];
        var opt_dict = {};
        var key;
        var active = false;
        $(contentTypeSelect).find('option').each(function() {
            if (this.value) {
                key = that.url_array[this.value].split('/')[0];
                opt_keys.push(key);
                var to_insert = {
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
        
        var i;
        var opt_group;
        var option;
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
        
        // install event handler for select
        $(contentTypeSelect).change(function() {
        	that.hideLookupLink();
        	// Set our objectId when the content_type is changed
        	if (this.value) {
        		that.showLookupLink(this.value);
        	}
        });
	},
	getLookupUrl: function (cID) {
		return '../../../' + this.url_array[cID] + '/';
	},
	hideLookupLink: function() {
		$('#lookup_' + this.elem.id).unbind().remove();
		$('#lookup_text_' + this.prev_cID);
	},
	showLookupLink: function (cID) {
		var that = this;
		
		if (this.cID !== cID) {			
			var url = this.getLookupUrl(cID);
			var id = 'lookup_' + this.elem.id;
			
			var link = '<a class="related-lookup" id="' + id + '" href="' + url + '">';
			link = link + '<img src="' + this.admin_media_url + 'img/admin/selector-search.gif" style="cursor: pointer; margin-left: 5px; margin-right: 10px;" width="16" height="16" alt="Lookup"></a>';
			link = link + '<strong id="lookup_text_' + cID + '" margin-left: 5px"></strong>'
			
			// insert link html after input element
			$(this.elem).after(link);
			
			$('#' + id).click(function() {
				return that.popRelatedObjectLookup(this);
	        });
			
			this.cID = cID;
		}
	},
	pollInputChange: function () {
		// wait max. 500ms for a new value, return earlier if the value changed
		for (i = 0; i <= 5; i++) {
			if (this.elem.value !== this.old_input_value) {
				setTimeout(this.pollInputChange, 100);
			}
		}
		return true;
	},
	popRelatedObjectLookup: function(link) {
		var name = link.id.replace(/^lookup_/, '');
	    name = id_to_windowname(name);
	    var href;
	    if (link.href.search(/\?/) >= 0) {
	        href = link.href + '&pop=1';
	    } else {
	        href = link.href + '?pop=1';
	    }
	    var win = window.open(href, name, 'height=500,width=800,resizable=yes,scrollbars=yes');
	    
	    var that = this;
	    this.old_input_value = this.elem.value;
	    $(win).bind('beforeunload', function() {
            that.pollInputChange();
            that.updateObjectData();
        });
	    
	    win.focus();
	    return false;
	},
	updateObjectData: function() {
		var that = this;
		return function () {
			$('#lookup_text_' + that.cID).text('loading...');
			alert(that.elem.value);
			$.ajax({
				url: that.obj_url,
				dataType: 'json',
				data: {object_id: that.elem.value, content_type: that.cID},
				success: function(data) {
					item = data[0];
					$('#lookup_text_' + that.cID).text(item.contentTypeText + ': ' + item.objectText);
				}
			});
		};
	},
	Admin: function(elem) {
		var that = this;
		// initialize the url array 
		this.loadUrlArray();
		// store the base element
		this.elem = elem;
		// find the select we need to change
		this.prepareSelect();
        
		// Bind to the onfocus of the window and the onblur of the object_id input.
        $(this.elem).blur(this.updateObjectData());
	}, 	
};
		
$(document).ready(function() {	
	$("[id$='object_id']").each(function(i, e) {
		GenericAdmin.Admin(this);
	});
});
}(django.jQuery));