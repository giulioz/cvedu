#
# docker build -t cvedu .
# docker run -it --rm -v $PWD/build:/usr/src/app/build -v $PWD/src:/usr/src/app/src cvedu
#

from node:10

WORKDIR /usr/src/app
COPY . .

RUN npm install -g yarn
RUN npm install

VOLUME ["/usr/src/app/src"]
VOLUME ["/usr/src/app/build"]

CMD ["yarn","build"]

