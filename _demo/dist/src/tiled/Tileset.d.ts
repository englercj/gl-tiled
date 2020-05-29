import { IPoint } from '../IPoint';
import { IProperty } from './IProperty';
import { IObjectgroup } from './layers';
export interface ITileAnimationFrame {
    /** Time to display this frame in ms (int) */
    duration: number;
    /** The tile id of the tile to use for this frame (int) */
    tileid: number;
}
export interface ITile {
    /** Array of frames. */
    animation?: ITileAnimationFrame[];
    /** Local ID of the tile within it's tileset. */
    id: number;
    /** Image to render, set when this is an imagelayer */
    image?: string;
    /** Image height, set when this is an imagelayer */
    imageheight?: number;
    /** Image width, set when this is an imagelayer */
    imagewidth?: number;
    /** Layer with the type 'objectgroup' */
    objectgroup?: IObjectgroup;
    /** Percentage chance this tile is chosen when competing with others in the editor (double) */
    probability?: number;
    /** A list of properties (name, value, type) */
    properties?: IProperty[];
    /**
     * index of terrain for each corner of tile
     * The order of indices is: top-left, top-right, bottom-left, bottom-right.
     */
    terrain?: [number, number, number, number];
    /** The type of the tile (optional). */
    type?: string;
}
export interface ITerrain {
    /** Name of terrain */
    name: string;
    /** A list of properties (name, value, type). */
    properties?: IProperty[];
    /** Local ID of tile representing terrain (int) */
    tile: number;
}
export interface ITilesetGrid {
    /** Cell height of tile grid (int) */
    height: number;
    /** Orientation of the grid for the tiles in this tileset */
    orientation: 'orthogonal' | 'isometric';
    /** Cell width of tile grid (int) */
    width: number;
}
export interface IWangColor {
    /** Hex-formatted color (#RRGGBB or #AARRGGBB). */
    color: string;
    /** Name of the Wang color. */
    name: string;
    /** Probability used when randomizing. (double) */
    probability: number;
    /** Local ID of the tile representing the Wang color. (int) */
    tile: number;
}
export interface IWangTile {
    /** Tile is flipped diagonally. Default: false */
    dflip?: boolean;
    /** Tile is flipped horizontally. Default: false */
    hflip?: boolean;
    /** Local ID of tile. (int) */
    tileid: number;
    /** Tile is flipped vertically. Default: false */
    vflip?: boolean;
    /** Array of Wang color indexes (uchar[8]). */
    wangid: [number, number, number, number, number, number, number, number];
}
export interface IWangSet {
    /** Array of Wang colors. */
    cornercolors: IWangColor[];
    /** Array of Wang colors. */
    edgecolors: IWangColor[];
    /** Name of the Wang set. */
    name: string;
    /** A list of properties (name, value, type). */
    properties?: IProperty[];
    /** Local ID of tile representing the Wang set. */
    tile: number;
    /** Array of Wang tiles. */
    wangtiles: IWangTile[];
}
/**
 * Interface representing a Tiled tileset.
 * See: http://doc.mapeditor.org/en/latest/reference/json-map-format/
 */
export interface ITileset {
    /** Hex-formatted color (#RRGGBB or #AARRGGBB) */
    backgroundcolor?: string;
    /** The number of tile columns in the tileset (int) */
    columns: number;
    /** GID corresponding to the first tile in the set */
    firstgid: number;
    /** TDetermines how tile overlays for terrain and collision information are rendered. Only used for isometric orientation. */
    grid?: ITilesetGrid;
    /** Image used for tiles in this set */
    image?: string;
    /** Height of source image in pixels (int) */
    imageheight: number;
    /** Width of source image in pixels (int) */
    imagewidth: number;
    /** Buffer between image edge and first tile (pixels) (int) */
    margin: number;
    /** Name given to this tileset */
    name: string;
    /** A list of properties (name, value, type). */
    properties?: IProperty[];
    /** The external file that contains this tilesets data */
    source?: string;
    /** Spacing between adjacent tiles in image (pixels) (int) */
    spacing: number;
    /** Array of Terrains (optional) */
    terrains?: ITerrain[];
    /** The number of tiles in this tileset (int) */
    tilecount: number;
    /** The Tiled version used to save the file */
    tiledversion?: string;
    /** Maximum height of tiles in this set (int) */
    tileheight: number;
    /** Specifies an offset in pixels, to be applied when drawing a tile from the related tileset. */
    tileoffset?: IPoint;
    /** Gid-indexed Tiles (optional) */
    tiles?: ITile[];
    /** Maximum width of tiles in this set (int) */
    tilewidth: number;
    /** Hex-formatted color (#RRGGBB) */
    transparentcolor?: string;
    /** Type of the tileset, always 'tileset'. Only set for tileset files. */
    type?: 'tileset';
    /** The JSON format version. */
    version?: number;
    /** Array of wangsets (optional). */
    wangsets?: IWangSet[];
}
