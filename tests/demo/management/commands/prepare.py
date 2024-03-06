from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.management import BaseCommand
from ...models import TaggedItem

User = get_user_model()

class Command(BaseCommand):
    def handle(self, **options):
        self._seed_admin_user()
        self._seed_other_user()
        self._seed_tagged_item()

    def _seed_admin_user(self):
        try:
            user = User.objects.get(username='admin')
        except User.DoesNotExist:
            user = User(username='admin', email='admin@example.org')

        if not user.is_staff:
            user.is_staff = True

        if not user.is_superuser:
            user.is_superuser = True

        if not user.password:
            user.set_password('admin')

        user.save()

    def _seed_other_user(self):
        try:
            user = User.objects.get(username='other')
        except User.DoesNotExist:
            user = User(username='other', email='other@example.org')

        user.save()

    def _seed_tagged_item(self):
        user = User.objects.get(username='admin')
        TaggedItem.objects.get_or_create(content_type=ContentType.objects.get_for_model(User), object_id=user.id, tag='admin-tag')
