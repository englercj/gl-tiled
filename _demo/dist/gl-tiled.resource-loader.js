/*!
* gl-tiled - v1.0.0
* Compiled Mon, 09 Mar 2020 21:00:53 UTC
*
* gl-tiled is licensed under the MIT License.
* http://www.opensource.org/licenses/mit-license
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('resource-loader')) :
    typeof define === 'function' && define.amd ? define(['exports', 'resource-loader'], factory) :
    (global = global || self, factory((global.glTiled = global.glTiled || {}, global.glTiled['resource-loader'] = {}), global.Loader));
}(this, (function (exports, resourceLoader) { 'use strict';

    /**
     * Creates the tiled loader middleware function and returns it.
     *
     * @example
     * const loader = new Loader();
     *
     * // add this middleware so that any map files we load will also have all their sub resources
     * // loaded too.
     * loader.use(glTiled['resource-loader'].tiledMiddlewareFactory());
     * loader.add('lightworld', 'maps/lttp/lightworld/lightworld.json');
     * loader.load(function ()
     * {
     *      // create the tilemap using the loaded map data (`resources.lightworld.data`) and passing
     *      // all resources as the third parameter which is the resource cache the Tilemap object
     *      // will search for map resources in before trying to load them itself.
     *      var tilemap = new glTiled.Tilemap(gl, loader.resources.lightworld.data, loader.resources);
     * })
     */
    function tiledMiddlewareFactory() {
        return function tiledMiddleware(resource, next) {
            if (!resource.data
                || resource.type !== resourceLoader.ResourceType.Json
                || !resource.data.layers
                || !resource.data.tilesets) {
                next();
                return;
            }
            var urlDir = resource.url.replace(this.baseUrl, '');
            urlDir = urlDir.substr(0, urlDir.lastIndexOf('/')) + '/';
            var addOptions = {
                url: '',
                crossOrigin: resource.strategy.config.crossOrigin,
                strategy: resourceLoader.ImageLoadStrategy,
                metadata: resource.metadata.imageMetadata,
                parentResource: resource,
            };
            for (var i = 0; i < resource.data.tilesets.length; ++i) {
                var tileset = resource.data.tilesets[i];
                if (tileset.image) {
                    if (!this.resources[tileset.image]) {
                        var options = Object.assign({}, addOptions);
                        options.name = tileset.image;
                        options.url = urlDir + tileset.image;
                        this.add(options);
                    }
                }
                if (resource.data.tiles) {
                    for (var key in resource.data.tiles) {
                        var tile = resource.data.tiles[key];
                        if (tile.image && !this.resources[tile.image]) {
                            var options = Object.assign({}, addOptions);
                            options.name = tile.image;
                            options.url = urlDir + tile.image;
                            this.add(options);
                        }
                    }
                }
            }
            for (var i = 0; i < resource.data.layers.length; ++i) {
                var layer = resource.data.layers[i];
                if (layer.image) {
                    if (!this.resources[layer.image]) {
                        var options = Object.assign({}, addOptions);
                        options.name = layer.image;
                        options.url = urlDir + layer.image;
                        this.add(options);
                    }
                }
            }
            next();
        };
    }

    exports.tiledMiddlewareFactory = tiledMiddlewareFactory;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
