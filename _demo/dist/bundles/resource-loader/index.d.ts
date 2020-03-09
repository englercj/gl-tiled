import { Loader, Resource } from 'resource-loader';
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
export declare function tiledMiddlewareFactory(): (this: Loader, resource: Resource, next: Function) => void;
