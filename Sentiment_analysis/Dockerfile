FROM python:3.13-slim


WORKDIR /code


COPY ./huggingface ./huggingface

RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
# RUN pip install --no-cache-dir psycopg2
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt



COPY ./app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
