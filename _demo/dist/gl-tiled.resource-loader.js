/*!
* gl-tiled - v1.0.0
* Compiled Mon, 08 Jan 2018 01:40:05 UTC
*
* gl-tiled is licensed under the MIT License.
* http://www.opensource.org/licenses/mit-license
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.glTiled = global.glTiled || {}, global.glTiled['resource-loader'] = {})));
}(this, (function (exports) { 'use strict';

function tiledMiddlewareFactory() {
    return function tiledMiddleware(resource, next) {
        if (!resource.data
            || resource.type !== Loader.Resource.TYPE.JSON
            || !resource.data.layers
            || !resource.data.tilesets) {
            next();
            return;
        }
        var loadOptions = {
            crossOrigin: resource.crossOrigin,
            loadType: Loader.Resource.LOAD_TYPE.IMAGE,
            metadata: resource.metadata.imageMetadata,
            parentResource: resource,
        };
        var urlDir = resource.url.replace(this.baseUrl, '');
        urlDir = urlDir.substr(0, urlDir.lastIndexOf('/')) + '/';
        for (var i = 0; i < resource.data.tilesets.length; ++i) {
            var tileset = resource.data.tilesets[i];
            if (tileset.image) {
                if (!this.resources[tileset.image]) {
                    this.add(tileset.image, urlDir + tileset.image, loadOptions);
                }
            }
            else if (resource.data.tiles) {
                for (var key in resource.data.tiles) {
                    var tile = resource.data.tiles[key];
                    if (tile.image && !this.resources[tile.image]) {
                        this.add(tile.image, urlDir + tile.image, loadOptions);
                    }
                }
            }
        }
        for (var i = 0; i < resource.data.layers.length; ++i) {
            var layer = resource.data.layers[i];
            if (layer.image) {
                if (!this.resources[layer.image]) {
                    this.add(layer.image, urlDir + layer.image, loadOptions);
                }
            }
        }
        next();
    };
}

exports.tiledMiddlewareFactory = tiledMiddlewareFactory;

Object.defineProperty(exports, '__esModule', { value: true });

})));
