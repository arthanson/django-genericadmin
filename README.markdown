# django-genericadmin

A simple django app to make the lookup of generic models easier.

## Installation

To install add it to your `INSTALLED_APPS` setting. There is no need to
run `manage.py syncdb` because _django-genericadmin_ does not have any models.

<code>
	INSTALLED_APPS = (
        ...
        'genericadmin',
        ...
    )
</code>

Link or copy `genericadmin.js` from `genericadmin/media/js` to your asset
directory and set `GENERICADMIN_JS`. The path will be prepended with your
`MEDIA_URL` setting.

## Usage

To use _django-genericadmin_ your model admin class must inherit from 
`GenericAdminModelAdmin`. 

So a model admin like

<code>
	class NavBarEntryAdmin(admin.ModelAdmin):
    	pass

	admin.site.register(NavBarEntry, NavBarEntryAdmin)
</code>

becomes

<code>
	from genericadmin.admin import GenericAdminModelAdmin

	class NavBarEntryAdmin(GenericAdminModelAdmin):
    	pass

	admin.site.register(NavBarEntry, NavBarEntryAdmin)
</code>

That's it.
