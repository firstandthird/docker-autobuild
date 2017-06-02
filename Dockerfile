FROM firstandthird/node:6.10-3-onbuild

USER root
RUN apk add --update docker
USER node

ENV PORT=8080
ENV SECRET=""
ENV GITHUB_TOKEN=""
ENV VERBOSE=0

VOLUME /repos

EXPOSE 8080
