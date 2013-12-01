django-genericadmin
===================

A simple django app to make the lookup of generic models easier.

Installation
------------

To install add it to your ``INSTALLED_APPS`` setting. There is no need
to run ``manage.py syncdb`` because *django-genericadmin* does not have
any models.

.. code:: python

    INSTALLED_APPS = (
       ...
       'genericadmin',
       ...
    )

If you are using the staticfiles app, then run
``manage.py collectstatic`` and you should be good to go.

If you don't know what I'm talking about or your django version < 1.3,
then you should link or copy ``genericadmin/media/js/`` to your asset
directory and set ``GENERICADMIN_JS`` to a the relative destination of
your just copied files.

Usage
-----

To use *django-genericadmin* your model admin class must inherit from
``GenericAdminModelAdmin``.

So a model admin like

.. code:: python

    class NavBarEntryAdmin(admin.ModelAdmin):
        pass

    admin.site.register(NavBarEntry, NavBarEntryAdmin)

becomes

.. code:: python

    from genericadmin.admin import GenericAdminModelAdmin

    class NavBarEntryAdmin(GenericAdminModelAdmin):
        pass

    admin.site.register(NavBarEntry, NavBarEntryAdmin)

That's it.

Provided admin classes
----------------------

A short overview of the admin classes and their uses provided by
*django-genericadmin*.

-  **GenericAdminModelAdmin** — The admin for a standard Django model
   that has at least one generic foreign relation.

-  **TabularInlineWithGeneric** and **StackedInlineWithGeneric** —
   Normal inline admins for models that have a generic relation and are
   edited inline.

-  **GenericTabularInline** and **GenericStackedInline** — Used to
   provide *True Polymorphic Relationships* (see below) and generic
   relations in the admin. Also see the Django docs
   `here <https://docs.djangoproject.com/en/dev/ref/contrib/contenttypes/#generic-relations-in-forms-and-admin>`__.

Inline Usage
------------

To use *django-genericadmin* with admin inlines, your models must
inherit from ``GenericAdminModelAdmin`` as described above:

.. code:: python

    from genericadmin.admin import GenericAdminModelAdmin

    class NavBarEntryAdmin(GenericAdminModelAdmin):
        pass

    admin.site.register(NavBarEntry, NavBarEntryAdmin)

Additionally the inline classes must inherit from either
``StackedInlineWithGeneric`` or ``TabularInlineWithGeneric``:

.. code:: python

    from genericadmin.admin import GenericAdminModelAdmin, TabularInlineWithGeneric

    class PagesInline(TabularInlineWithGeneric):
        model = ...

    class NavBarEntryAdmin(GenericAdminModelAdmin):
        inlines = [PagesInline, ]

    ...

Note that you can't mix and match. If you're going to use a generic
inline, the class using it must inherit from ``GenericAdminModelAdmin``.

Specifying which fields are handled
-----------------------------------

In most cases *django-genericadmin* will correctly figure out which
fields on your model are generic foreign keys and just do the right
thing. If you want to specify the fields yourself (Be a man! Control
your own destiny and all that) you can use the ``generic_fk_fields``
attribute on the admin class. Note that you can specify the fields on
each admin class for inline admins. So, for the above mentioned inline
admin, you would do it like so:

.. code:: python

    class PagesInline(TabularInlineWithGeneric):
        model = AReallyCoolPage
        generic_fk_fields = [{
            'ct_field': <field_name_for_contenttype_fk>,
            'fk_field': <field_name_for_object_id>,
        }]

If you want to use more then one field pair, you can just add more dicts
to the list.

If you use the ``ct_field`` and ``ct_fk_field`` attributes
*django-genericadmin* will always just ignore those fields and not even
try to use them.

Blacklisting Content Types
--------------------------

Specific content types can be removed from the content type select list.
Example:

.. code:: python

    class NavBarEntryAdmin(GenericAdminModelAdmin):
        content_type_blacklist = ('auth/group', 'auth/user', )

Whitelisting Content Types
--------------------------

Specific content types that can be display from the content type select
list. Example:

.. code:: python

    class NavBarEntryAdmin(GenericAdminModelAdmin):
        content_type_whitelist = ('auth/message', )

Note that this only happens on the client; there is no enforcement of
the blacklist at the model level.

Lookup parameters by Content Type
---------------------------------

Supply extra lookup parameters per content type similar to how
limit\_choices\_to works with raw id fields. Example:

.. code:: python

    class NavBarEntryAdmin(GenericAdminModelAdmin):
        content_type_lookups = {'app.model': {'field': 'value'}

True Polymorphic Relationships
------------------------------

``django-genericadmin`` also provides a UI to easily manage a
particularly useful model that, when used as an inline on another model,
enables relations from any entry of any model to any other entry of any
other model. And, because it has a generic relationship moving in both
directions, it means it can be attached as an inline *to any model*
without having to create unique, individual foreign keys for each model
you want to use it on.

Here's an example of a polymorphic model:

.. code:: python

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

.. code:: python

    from whateverapp.models import RelatedContent
    from genericadmin.admin import GenericAdminModelAdmin, GenericTabularInline
        
    class RelatedContentInline(GenericTabularInline):
        model = RelatedContent
        ct_field = 'parent_content_type' # See below (1).
        ct_fk_field = 'parent_object_id' # See below (1).
            
    class WhateverModelAdmin(GenericAdminModelAdmin): # Super important! See below (2).
        content_type_whitelist = ('app/model', 'app2/model2' ) # Add white/black lists on this class
        inlines = [RelatedContentInline,]

(1) By default ``ct_field`` and ``ct_fk_field`` will default to
``content_type`` and ``object_id`` respectively. ``ct_field`` and
``ct_fk_field`` are used to create the parent link from the inline to
the model you are attaching it to (similar to how Django does this
attachment using foreign keys with more conventional inlines). You could
also leave this configuration out of your inline classes but, if you do
that, I encourage you to change the model attributes from
``parent_content_type`` & ``parent_object_id`` to ``child_content_type``
& ``child_object_id``. I say this because, when it comes time to make
queries, you'll want to know which direction you're 'traversing' in.

(2) Make sure that whatever the admin classes are utilizing these
inlines are subclasses of ``GenericAdminModelAdmin`` from
``django-genericadmin`` or else the handy-dandy javascript-utilizing
interface won't work as intended.
