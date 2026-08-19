FROM online-ide-base:latest
USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip && rm -rf /var/lib/apt/lists/*
USER runner
CMD ["python3"]
