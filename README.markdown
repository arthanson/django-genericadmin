# django-genericadmin

A simple django app to make the lookup of generic models easier. 

If used with grappelli only the model select is rendered a little nicer. 
The rest is done by grappelli.

## Installation

To install add it to your `INSTALLED_APPS` setting. There is no need to
run `manage.py syncdb` because _django-genericadmin_ does not have any models.

    INSTALLED_APPS = (
       ...
       'genericadmin',
       ...
    )

If you are using the staticfiles app, then run `manage.py collectstatic` and you should be 
good to go. 

If you don't know what I'm talking about or your django version < 1.3, then you
should link or copy `genericadmin/media/js/` to your asset directory and set
`GENERICADMIN_JS` to a the relative destination of your just copied files. 

## Usage

To use _django-genericadmin_ your model admin class must inherit from 
`GenericAdminModelAdmin`. 

So a model admin like

    class NavBarEntryAdmin(admin.ModelAdmin):
        pass

    admin.site.register(NavBarEntry, NavBarEntryAdmin)

becomes

    from genericadmin.admin import GenericAdminModelAdmin

    class NavBarEntryAdmin(GenericAdminModelAdmin):
        pass

    admin.site.register(NavBarEntry, NavBarEntryAdmin)

That's it.


## Inline Usage

To use _django-genericadmin_ with admin inlines, your models must inherit from 
`GenericAdminModelAdmin` as described above:

	from genericadmin.admin import GenericAdminModelAdmin

	class NavBarEntryAdmin(GenericAdminModelAdmin):
    	pass

	admin.site.register(NavBarEntry, NavBarEntryAdmin)

Additionally the inline classes must inherit from either `GenericStackedInline`
or `GenericTabularInline`:

	from genericadmin.admin import GenericAdminModelAdmin, GenericTabularInline

	class PagesInline(GenericTabularInline):
    	model = ...

	class NavBarEntryAdmin(GenericAdminModelAdmin):
    	inlines = [PagesInline, ]

	...

Note that you can't mix and match.  If you're going to use a generic inline,
the class using it must inherit from `GenericAdminModelAdmin`.

## Blacklisting Content Types

Specific content types can be removed from the content type select list.
Example:

	class NavBarEntryAdmin(GenericAdminModelAdmin):
    	content_type_blacklist = ('auth/group', 'auth/user', )

Note that this only happens on the client; there is no enforcement of the
blacklist at the model level.

