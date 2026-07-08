FROM python:3.9-slim

# 安裝 Google Chrome 依賴及中文字型（避免 PDF 中文亂碼）
RUN apt-get update && apt-get install -y \
    wget gnupg curl unzip fonts-wqy-zenhei \
    --no-install-recommends

# 安裝 Google Chrome stable 版本
RUN curl -LO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render 預設使用 PORT 環境變數，因此我們設為 8080 並與啟動指令搭配
EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
