FROM firstandthird/node:6.10-3-onbuild

USER root
RUN apk add --update docker curl bash

RUN curl https://raw.githubusercontent.com/firstandthird/docker-builder/2.1.0/builder > /home/app/builder
RUN chmod +x /home/app/builder

ENV PORT=8080
ENV SECRET=""
ENV GITHUB_TOKEN=""
ENV REPOS=/repos

VOLUME /repos

EXPOSE 8080
