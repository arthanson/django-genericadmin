
from distutils.core import setup

setup(
    name='genericadmin',
    version='0.2',
    description="Adds support for generic relations within Django's admin interface.",
    author='Weston Nielson, Jan Schrewe',
    author_email='wnielson@gmail.com, jschrewe@googlemail.com',
    url='http://bitbucket.org/knurpsburps/django-genericadmin/overview',
    packages = ['genericadmin'],
    package_data={'genericadmin': ['media/js/*.js']},
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Environment :: Web Environment',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Framework :: Django',
    ],
    include_package_data=True,
    zip_safe=False,
    install_requires=['setuptools'],
)