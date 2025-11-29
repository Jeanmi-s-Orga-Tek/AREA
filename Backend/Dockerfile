#docker build -t area-fastapi .  

FROM python:3.9

WORKDIR /code
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
ENV PYTHONPATH=/code

COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app
COPY ./services /code/services
COPY ./actions /code/actions
COPY ./reactions /code/reactions
COPY ./templates /code/templates
COPY ./config /code/Backend/config


EXPOSE 80
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
