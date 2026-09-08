FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

RUN pip install --no-cache-dir uv
WORKDIR /app

COPY pyproject.toml uv.lock alembic.ini ./
COPY migrations/ ./migrations/
RUN uv sync --frozen --no-dev

COPY nche/ ./nche/
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER 10001
EXPOSE 8000
CMD ["./entrypoint.sh"]