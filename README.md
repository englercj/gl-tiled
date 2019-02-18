# gl-tiled

A WebGL renderer for maps created with the [Tiled Editor](http://mapeditor.org).

Tested with Tiled Map Editor v1.2.2.

## Contents

- [Usage](#usage)
- [API Reference](bundles/gl-tiled/#api-reference)
- [Framework Bundles](#framework-bundles)

## Usage

For the most basic usage, you only need to provide a JS object that represents the parsed JSON Tiled
map and a WebGL Context to render with.

```js
// Create the map instance. `mapData` is the parsed Tiled JSON map,
// and `gl` is the WebGLRenderingContext.
var tilemap = new glTiled.Tilemap(mapData, { gl });

// size the viewport of the map
tileMap.resizeViewport(gl.canvas.width, gl.canvas.height);

// setup a update and render loop
var lastTime = 0;
(function draw(now)
{
    requestAnimationFrame(draw);

    // update animations, if your map has no animated tiles
    // you can skip this step.
    var dt = now - lastTime;
    lastTime = now;
    tileMap.update(dt);

    // draw!
    tileMap.draw();
})();
```

## Framework Bundles

This library also ships with a number of bundles (`gl-tiled.<bundle-name>.js`). These bundles contain
the code necessary for gl-tiled to integrate with other frameworks. Each bundle is listed below, with
a short description of what they do. For more information click their _Documentation_ link.

### Core (`gl-tiled.js`) - [Documentation](bundles/gl-tiled/)

This is the core library bundle. It is meant to work with WebGL, and therefore can work with any
framework. However, it does not provide any special code to ease integration with those frameworks.

### Resource Loader (`gl-tiled.resource-loader.js`) - [Documentation](bundles/resource-loader/)

The Resource Loader bundle a [resource-loader](https://github.com/englercj/resource-loader)
middleware that makes it easy to load Tiled JSON maps.
