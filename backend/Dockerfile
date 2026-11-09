FROM python:3.12-slim-bookworm@sha256:e697c81897302a4c4333bade000d98038fbb21eb064f8ee1fd42d02ebcd9d337 AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --create-home --home-dir /home/app app

COPY requirements.txt requirements.lock.txt ./
RUN pip install --no-cache-dir -r requirements.txt -c requirements.lock.txt && pip check

FROM base AS test
COPY app/ ./app/
COPY tests/ ./tests/
RUN python -m unittest discover -s tests -v

FROM base AS runtime
COPY --from=test --chown=app:app /app/app/ ./app/

ENV HOME=/home/app XDG_CACHE_HOME=/home/app/.cache

RUN mkdir -p /app/data && chown app:app /app/data

USER app
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
