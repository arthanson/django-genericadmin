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

## Whitelisting Content Types

Specific content types that can be display from the content type select list.
Example:

	class NavBarEntryAdmin(GenericAdminModelAdmin):
    	content_type_whitelist = ('auth/message', )

Note that this only happens on the client; there is no enforcement of the
blacklist at the model level.

## Lookup parameters by Content Type

Supply extra lookup parameters per content type similar to how 
limit_choices_to works with raw id fields.
Example:

    class NavBarEntryAdmin(GenericAdminModelAdmin):
        content_type_lookups = {'app.model': {'field': 'value'}

## True Polymorphic Relationships

`django-genericadmin` also provides a UI to easily manage a particularly useful model that, when used as an inline on another model, enables relations from any entry of any model to any other entry of any other model. And, because it has a generic relationship moving in both directions, it means it can be attached as an inline _to any model_ without having to create unique, individual foreign keys for each model you want to use it on.

Here's an example of a polymorphic model:

    from django.db import models
    from django.contrib.contenttypes.models import ContentType
    from django.contrib.contenttypes import generic
    
    class RelatedContent(models.Model):
        """
        Relates any one entry to another entry irrespective of their individual models.
        """
        content_type = models.ForeignKey(ContentType)
        object_id = models.PositiveIntegerField()
        content_object = generic.GenericForeignKey('content_type', 'object_id')

        parent_content_type = models.ForeignKey(ContentType, related_name="parent_test_link")
        parent_object_id = models.PositiveIntegerField()
        parent_content_object = generic.GenericForeignKey('parent_content_type', 'parent_object_id')

        def __unicode__(self):
            return "%s: %s" % (self.content_type.name, self.content_object)

And here's how you'd set up your admin.py:

    from whateverapp.models import RelatedContent
    from genericadmin.admin import GenericAdminModelAdmin, GenericTabularInline
    
    class RelatedContentInline(GenericTabularInline):
        model = RelatedContent
        ct_field = 'parent_content_type' # See below.**
        ct_fk_field = 'parent_object_id' # See below.**
        
    class WhateverModelAdmin(GenericAdminModelAdmin): # Super important!***
        content_type_whitelist = ('app/model', 'app2/model2' ) # Add white/black lists on this class
        inlines = [RelatedContentInline,]
        
** By default `ct_field` and `ct_fk_field` will default to `content_type` and `object_id` respectively. `ct_field` and `ct_fk_field` are used to create the parent link from the inline to the model you are attaching it to (similar to how Django does this attachment using foreign keys with more conventional inlines). You could also leave this configuration out of your inline classes but, if you do that, I encourage you to change the model attributes from `parent_content_type` & `parent_object_id` to `child_content_type` & `child_object_id`. I say this because, when it comes time to make queries, you'll want to know which direction you're 'traversing' in.

*** Make sure that whatever the admin classes are utilizing these inlines are subclasses of `GenericAdminModelAdmin` from `django-genericadmin` or else the handy-dandy javascript-utilizing interface won't work as intended.