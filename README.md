# Mock Image Server

Mock-image-server is an simple image generation server for building website mock-ups.
Serve images generated with specified size, color, text.

## Run 

### Local environment

Just run `npm start`.
```
npm start
curl http://localhost:3000/300x200.jpg
```

### Docker

You could also use the published docker image. see [mitonize/mock-image-server](https://hub.docker.com/r/mitonize/mock-image-server).

Start the Docker container by binding port 3000.
```
docker run -d -p 3000:3000 mitonize/mock-image-server
curl http://localhost:3000/300x200.jpg
```

## Parameters
Each parameter is optional.

| parameter | description | default value |
|------------------|--------------------|-----------------------|
| text            | Text rendered in the image. '%0a' is for newline. | generated as "{width}x{height}" |
| key            | Color decision key. Same key is as same color.   | treat text parameter value as key. |
| palette     | Specify  color palette definition. Palette is defined in palette.yml. | "neutral" (built in palette) |

### example

http://localhost:3000/300x200.jpg?text=AAAA

These two images are same color since each key is as same. Color is determined automatically from current color palette.
```
http://localhost:3000/300x200.jpg?text=AAAA&key=KEY1
http://localhost:3000/300x200.jpg?text=BBBB&key=KEY1
```

To specify color palette, use `palette` parameter. 
These two images below are **different** color in spite of the same key since palette is not as same.

The palette are defined in YAML file. see **palette.yml**
```
http://localhost:3000/300x200.jpg?text=AAAA&key=KEY1&palette=pink
http://localhost:3000/300x200.jpg?text=BBBB&key=KEY1&palette=blue
```


