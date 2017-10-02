import ILayer from './TileLayer';
import ITileset from './Tileset';

/**
 * Interface representing a Tiled map.
 * See: http://doc.mapeditor.org/en/latest/reference/json-map-format/#map
 */
export default interface ITilemap
{
    /** The JSON format version */
    version: number;

    /** The Tiled version used to save the file */
    tiledversion: string;

    /** Number of tile columns (int) */
    width: number;

    /** Number of tile rows (int) */
    height: number;

    /** Map grid width. (int) */
    tilewidth: number;

    /** Map grid height. (int) */
    tileheight: number;

    /** Orthogonal, isometric, or staggered */
    orientation: string;

    /** Array of Layers */
    layers: ILayer[];

    /** Array of Tilesets */
    tilesets: ITileset[];

    /** Hex-formatted color (#RRGGBB or #AARRGGBB) (optional) */
    backgroundcolor: string;

    /** Rendering direction (orthogonal maps only) */
    renderorder: string;

    /** String key-value pairs */
    properties: object;

    /** Auto-increments for each placed object (int) */
    nextobjectid: number;
}
