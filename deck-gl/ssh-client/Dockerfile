FROM debian

RUN apt-get update \
 && apt-get install -y openssh-client \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*