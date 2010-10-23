# django-genericadmin

A simple django app to make the lookup of generic models easier. 

If used with grappelli only the model select is rendered a little nicer. 
The rest is done by grappelli.

## Installation

To install add it to your `INSTALLED_APPS` setting. There is no need to
run `manage.py syncdb` because _django-genericadmin_ does not have any models.

<pre>
INSTALLED_APPS = (
    ...
    'genericadmin',
    ...
)
</pre>

Link or copy `genericadmin/media/js/` to your asset directory and set
 `GENERICADMIN_JS` to your path. 

## Usage

To use _django-genericadmin_ your model admin class must inherit from 
`GenericAdminModelAdmin`. 

So a model admin like

<pre>
class NavBarEntryAdmin(admin.ModelAdmin):
    pass

admin.site.register(NavBarEntry, NavBarEntryAdmin)
</pre>

becomes

<pre>
from genericadmin.admin import GenericAdminModelAdmin

class NavBarEntryAdmin(GenericAdminModelAdmin):
    pass

admin.site.register(NavBarEntry, NavBarEntryAdmin)
</pre>

That's it.
