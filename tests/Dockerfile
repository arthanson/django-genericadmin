ARG PYTHON_VERSION
FROM python:${PYTHON_VERSION}

ARG DJANGO_VERSION
RUN pip install django==${DJANGO_VERSION}

WORKDIR /app
COPY genericadmin ./genericadmin
COPY tests ./tests
RUN python tests/manage.py migrate &&\
    python tests/manage.py prepare

EXPOSE 8000
CMD ["python", "tests/manage.py", "runserver", "0.0.0.0:8000"]
