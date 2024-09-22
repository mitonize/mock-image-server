# Mock Image Server
![Docker Image Version (latest semver)](https://img.shields.io/docker/v/mitonize/mock-image-server?style=flat-square&logo=docker&logoColor=white) ![Docker Pulls](https://img.shields.io/docker/pulls/mitonize/mock-image-server?style=flat-square&logo=docker&logoColor=white)


Mock-image-server is a simple image generation server for building website mock-ups.
Serve images generated with specified size, color, text.

**Latest version** is 1.1.1

[CHANGELOG.md](CHANGELOG.md) for detail

## Run 

### Local environment

Just run `npm start`.
```
npm start
open http://localhost:3000/300x200.jpg
```

### Docker

You could also use the published docker image. see [mitonize/mock-image-server](https://hub.docker.com/r/mitonize/mock-image-server).

Start the Docker container by binding port 3000.
```sh
docker run -d -p 3000:3000 mitonize/mock-image-server
open http://localhost:3000/300x200.jpg
```

## Request specification

### Path

Foundamental parameters are specified as path component. Path format is as below. 

Basic one is simply only width, height and file format like 'png', 'jpg' and so on.
The other one clearly specifies the color.

 * /{width}x{height}.{extension} (e.g. /300x200.jpg )
 * /{color hex}/{width}x{height}.{extension}  (e.g. /99241c/300x200.png )

| path component | description |
|------------------|--------------------|
| {color hex} | Color hex code, No '#' needed. <br>highest priority color regardless of `palette`, `key`.|
| {width}     | Image width. range is 1 to 2000.|
| {height}     | Image height. range is 1 to 2000.|
| {extension} | File type as 'png', 'jpg', 'webp', 'avif' |

### Parameters
Each parameter is optional.

| parameter | description | default value |
|------------------|--------------------|-----------------------|
| text            | Text rendered in the image. '%0a' is for newline. | generated as "{width}x{height}" |
| key            | Color decision key. Same key is as same color.   | treat text parameter value as key. |
| palette     | Specify  color palette definition. Palette is defined in palette.yml. | "neutral" (built in palette) |
| from         | Enable to respond existing images by specifying folder name.   | (none) |

### HTTP Header

Above path and parameter can be specified at the request header `X-MockImageServer-Path` alternatively.
 If this header is set, actual path and parameter are  ignored.

```sh
curl -H X-MockImageServer-Path:/300x200.jpg?text=BBBB&key=KEY1 http://localhost:3000/any/path/to/image.jpg
```

### example

http://localhost:3000/300x200.jpg?text=AAAA

These two images are same color since each key is as same. Color is determined automatically from current color palette.
```sh
http://localhost:3000/300x200.jpg?text=AAAA&key=KEY1
http://localhost:3000/300x200.jpg?text=BBBB&key=KEY1
```

To specify color palette, use `palette` parameter. 
These two images below are **different** color in spite of the same key since palette is not as same.

The palette are defined in YAML file. see **palette.yml**
```sh
http://localhost:3000/300x200.jpg?text=AAAA&key=KEY1&palette=pink
http://localhost:3000/300x200.jpg?text=BBBB&key=KEY1&palette=blue
```


```sh
docker run -d -p 3000:3000 -v ./LOCAL-IMAGE-DIR:/app/img mitonize/mock-image-server

# Enable to respond existing images by specifying folder name as 'from' parameter 
open http://localhost:3000/300x360.jpg?from=img

# Also subfolder could be use
open http://localhost:3000/300x360.jpg?from=img/item
```

## Customizing

You can override palette definition by mounting `/app/palette.yml` as docker volume.

```sh
docker run -d -p 3000:3000 \
  -v ./LOCAL-IMAGE-DIR:/app/img \
  -v ./MY-PALETTE.yml:/app/palette.yml \
  mitonize/mock-image-server
```
