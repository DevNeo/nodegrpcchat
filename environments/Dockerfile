FROM node:10-alpine
WORKDIR /app
COPY package*.json /tmp/
RUN cd /tmp && npm install
# Moving dependencies from tmp folder to project folder
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

# Setting project folder as workdir
WORKDIR /opt/app

# Adding project files to container project folder
ADD . /opt/app

EXPOSE 5001

CMD npm rebuild && sleep 5 && npm start