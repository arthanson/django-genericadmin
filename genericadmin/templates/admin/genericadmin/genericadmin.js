{% load adminmedia genericadmin %}
{% get_generic_relation_list %}
/*
    genericadmin - Weston Nielson (wnielson@gmail.com)
*/

if (typeof(JQUERY_LIB) == 'undefined')
  var JQUERY_LIB = "http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js";
if (typeof(GENERIC_ADMIN_DELAY_INIT) == 'undefined')
  var GENERIC_ADMIN_DELAY_INIT = false;
var ADMIN_MEDIA_URL = "{% admin_media_prefix %}";
var ADMIN_OBJ_LOOKUP_URL = "{% url admin:admin_genericadmin_obj_lookup %}";

Array.prototype.unique = function () {
	var r = new Array();
	o:for(var i = 0, n = this.length; i < n; i++)
	{
		for(var x = 0, y = r.length; x < y; x++)
		{
			if(r[x]==this[i])
			{
				continue o;
			}
		}
		r[r.length] = this[i];
	}
	return r;
}

function loadFile(filename, filetype) {
  if (filetype=="js"){ //if filename is a external JavaScript file
    var fileref=document.createElement('script');
    fileref.setAttribute("type","text/javascript");
    fileref.setAttribute("src", filename);
  }
  else if (filetype=="css"){ //if filename is an external CSS file
    var fileref=document.createElement("link");
    fileref.setAttribute("rel", "stylesheet");
    fileref.setAttribute("type", "text/css");
    fileref.setAttribute("href", filename);
  }
  if (typeof fileref!="undefined")
    document.getElementsByTagName("head")[0].appendChild(fileref);
};

function GenericObject(i, objectIdEl) {
    this.objectIdEl = objectIdEl;
    this.contentTypeEl;
    
    this.contentTypeId; // Store the id of the content_type we want to look up
    this.prevContentTypeId;
    this.objectId; // Store the id of the object (object_id) we want to look up
    this.prevObjectId;
    
    // The lookup link
    this.lookupLink = $('<a class="related-lookup"></a>');
    this.lookupLink.click(function() {
        if (self.contentTypeEl.value) {
            showRelatedObjectLookupPopup(this);
        }
        return false;
    });
    this.lookupLink.attr('id', 'lookup_'+this.objectIdEl.id);
    
    // The lookup icon which will open a popup when clicked, but only if the associated content_type select element has a valid value
    this.lookupIcon = $('<img src="' + ADMIN_MEDIA_URL + 'img/admin/selector-search.gif" style="cursor: pointer; margin-left: 5px" width="16" height="16" alt="Lookup">');
    this.lookupLink.append(this.lookupIcon);
    
    // The inline text element to store the display of the actual object
    this.lookupText = $('<strong style="width: 100px; margin-left: 5px"></strong>');
    
    var self = this;
    this.__init__ = function() {
        // sets the associated content_type element
        vars = this.objectIdEl.id.split('-');   // should return 3 items: ["id_ingredientlist_set", "2", "content_type"]
        
        if (vars.length==1) { //not an inline edit
            id = '#id_content_type';
        } else {
            id = '#' + vars[0] + '-' + vars[1] + '-content_type';
        }
        this.contentTypeEl = $(id)[0];
        
        if (this.contentTypeEl.value) {
            this.contentTypeId = this.contentTypeEl.value;  // If the content_type has an initial value, now is a good time to set it
            this.lookupLink.attr('href', '../../../' + MODEL_URL_ARRAY[this.contentTypeEl.value] + '/');
            
            if (this.objectIdEl.value) {
                this.objectId = this.objectIdEl.value;
                this.updateObjectIdEl();
            }
        } else {
            this.lookupLink.hide();
        }
        
        // Create optgroups
        opt_keys = [];
        opt_dict = {};
        $(this.contentTypeEl).find('option').each(function(){
            if (this.value) {
                key = MODEL_URL_ARRAY[this.value].split('/')[0];
                opt_keys.push(key);
                if (!opt_dict[key]) {
                    opt_dict[key] = [this];
                } else {
                    opt_dict[key].push(this);
                }
                // Save the original css
                opt_color = $(this).css('color');
                opt_padding = $(this).css('padding');
                $(this).remove();
            }
        });
        
        opt_keys = opt_keys.unique().sort();
        for (i=0; i< opt_keys.length; i++) {
            key = opt_keys[i];
            $opt_group = $('<optgroup label="' + key + '"></optgroup>').css({
                "font-style": "normal",
                "font-weight": "bold", 
                "color": "#999",
                "padding-left": "2px"
            });
            $(this.contentTypeEl).append($opt_group);
            
            for (j in opt_dict[key]) {
                el = opt_dict[key][j];
                $(el).css({'color': opt_color, 'padding': opt_padding});
                $opt_group.append(el);
            }
        }
        
        $(this.contentTypeEl).change(function() {
            self.contentTypeId = this.value;    // Set our objectId when the content_type is changed
            if (self.contentTypeEl.value) {
                self.lookupLink.attr('href', '../../../' + MODEL_URL_ARRAY[this.value] + '/');
                self.lookupLink.show();
            } else {
                self.lookupLink.hide();
            }
        });
        
        // Add the lookup icon
        $(this.objectIdEl).after(this.lookupLink).after(this.lookupText).css('width', '10px');
        
        // Bind to the onfocus of the window and the onblur of the object_id input.
        $(window).focus(function(){self.updateObjectIdEl();});
        $(this.objectIdEl).blur(self.updateObjectIdEl);
    };
    
    this.updateObjectIdEl = function() {
        // Call the server for an update, but only if everything is good to go
        // First check that something has changed
        if (this.contentTypeId != this.prevContentTypeId || this.objectIdEl.value != this.prevObjectId) {
            this.prevObjectId = this.objectIdEl.value;
            this.prevContentTypeId = this.contentTypeId;
            
            // A change has been made, so let's double check that the values are sane (i.e not empty)
            if (this.objectIdEl.value && this.contentTypeId) {
                self.lookupText.text('loading...');
                $.getJSON(ADMIN_OBJ_LOOKUP_URL, {object_id: this.objectIdEl.value, content_type: this.contentTypeId},
                    function(data) {
                        item = data[0];
                        self.lookupText.text('');   // Clear out the `loading...` text
                        if (item.objectText) {
                            self.lookupText.text(item.objectText);
                        }
                });
            }
        }
    };
    
    // Run initialization and return
    this.__init__();
    
    return {
        objectIdEl:         this.objectIdEl,
        contentTypeEl:      this.contentTypeEl,
        lookupIcon:         this.lookupIcon,
        lookupText:         this.lookupText,
        lookupLink:         this.lookupLink,
        updateObjectIdEl:   this.updateObjectIdEl
    }
};

// Load jQuery dynamically if it isn't included already
if (typeof(jQuery) == 'undefined') {
  loadFile(JQUERY_LIB, "js");
}

if (typeof(GENERIC_ADMIN_DELAY_INIT) == 'undefined') {
  // Allow init to be delayed (stopped)
  var GENERIC_ADMIN_DELAY_INIT = false;
}

$(document).ready(function() {
    if (!GENERIC_ADMIN_DELAY_INIT)
      $("[id$='object_id']").each(GenericObject);
});