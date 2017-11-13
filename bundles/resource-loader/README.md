# gl-tiled.resource-loader.js

The Resource Loader bundle a [resource-loader](https://github.com/englercj/resource-loader)
middleware that makes it easy to load Tiled JSON maps.

This bundle is unique in that it actually does not depend on the gl-tiled core, and therefore
this bundle doesn't actually contain the core library. That means you can combine this bundle
with any other bundle without conflicts.

For example, you can include the core library (for use with WebGL) and this bundle (for use
with resource-loader):

```html
<script src="node_modules/resource-loader/dist/resource-loader.js"></script>

<script src="dist/gl-tiled.js"></script>
<script src="dist/gl-tiled.resource-loader.js"></script>
```

## API Reference

### `tiledMiddlewareFactory()`

Creates a new tiled middleware function and returns it.

Example:

```js
var loader = new Loader();

// add this middleware so that any map files we load will also have all their sub resources
// loaded too.
loader.use(glTiled['resource-loader'].tiledMiddlewareFactory());
loader.add('lightworld', 'maps/lttp/lightworld/lightworld.json');
loader.load(function ()
{
    // create the tilemap using the loaded map data (`resources.lightworld.data`) and passing
    // all resources as the third parameter which is the resource cache the Tilemap object
    // will search for map resources in before trying to load them itself.
    var tilemap = new glTiled.Tilemap(gl, loader.resources.lightworld.data, loader.resources);
})
```
