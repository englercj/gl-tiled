import { ILayer } from './layers';
import { ITileset } from './Tileset';
import { IProperty } from './IProperty';
/**
 * Interface representing a Tiled map.
 * See: http://doc.mapeditor.org/en/latest/reference/json-map-format/#map
 */
export interface ITilemap {
    /** Hex-formatted color (#RRGGBB or #AARRGGBB) (optional) */
    backgroundcolor?: string;
    /** Number of tile rows (int) */
    height: number;
    /** Length of the side of a hex tile in pixels (int) */
    hexsidelength: number;
    /** Whether the map has infinite dimensions */
    infinite: boolean;
    /** Array of Layers */
    layers: ILayer[];
    /** Auto-increments for each layer (int) */
    nextlayerid: number;
    /** Auto-increments for each placed object (int) */
    nextobjectid: number;
    /** Orthogonal, isometric, or staggered */
    orientation: 'orthogonal' | 'isometric' | 'staggered' | 'hexagonal';
    /** A list of properties (name, value, type). */
    properties: IProperty[];
    /** Rendering direction (orthogonal maps only) */
    renderorder: string;
    /** x or y (staggered / hexagonal maps only) */
    staggeraxis: 'x' | 'y';
    /** odd or even (staggered / hexagonal maps only) */
    staggerindex: 'odd' | 'even';
    /** The Tiled version used to save the file */
    tiledversion: string;
    /** Map grid height. (int) */
    tileheight: number;
    /** Array of Tilesets */
    tilesets: ITileset[];
    /** Map grid width. (int) */
    tilewidth: number;
    /** Type of the map, always 'map' */
    type: 'map';
    /** The JSON format version */
    version: number;
    /** Number of tile columns (int) */
    width: number;
}
