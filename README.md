# gl-tiled

A WebGL renderer for maps created with the [Tiled Editor](http://mapeditor.org).

Tested with Tiled Map Editor v1.0.3.

## Contents

- [Usage](#usage)
- [API Reference](bundles/gl-tiled/#api-reference)
- [Framework Bundles](#framework-bundles)

## Usage

For the most basic usage, you only need to provide a JS object that represents the parsed JSON Tiled
map.

```js
// Create the map instance. `mapData` is the parsed Tiled JSON map,
// and `gl` is the WebGLRenderingContext.
var tilemap = new glTiled.Tilemap(mapData, gl);

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
a short desription of what they do. For more information click their _Documentation_ link.

### Core (`gl-tiled`) - [Documentation](bundles/gl-tiled/)

This is the core library bundle. It is meant to work with WebGL, and therefore can work with any
framework. However, it does not provide any special code to ease integration with those frameworks.

### Phaser2 (`gl-tiled.phaser2`) - [Documentation](bundles/phaser2/)

The Phaser2 bundle is a wrapper around gl-tiled that makes it easy to integrate gl-tiled into your
existing [Phaser](https://github.com/photonstorm/phaser) game. This bundle includes the core
gl-tiled code.

### Pixi4 (`gl-tiled.pixi4`) - [Documentation](bundles/pixi4/)

The Pixi4 bundle is a wrapper around gl-tiled that makes it easy to integrate gl-tiled into your
existing [Pixi](https://github.com/pixijs/pixi.js) application. This bundle includes the core
gl-tiled code.

### Resource Loader (`gl-tiled.resource-loader`) - [Documentation](bundles/resource-loader/)

The Resource Loader bundle a [resource-loader](https://github.com/englercj/resource-loader)
middleware that makes it easy to load Tiled JSON maps.
