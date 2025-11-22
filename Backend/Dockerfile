#docker build -t area-fastapi .  

FROM python:3.9
WORKDIR /code
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt
COPY ./app /code/app
COPY ./services /code/services
COPY ./actions /code/actions
COPY ./reactions /code/reactions
COPY ./templates /code/templates
CMD ["fastapi", "run", "app/main.py", "--port", "80"]
