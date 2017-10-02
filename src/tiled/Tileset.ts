export interface ITileAnimFrame
{
    /** Time to display this frame in ms */
    duration: number;

    /** The tile id of the tile to use for this frame */
    tileid: number;
}

export interface ITile
{
    /**
     * index of terrain for each corner of tile
     * The order of indices is: top-left, top-right, bottom-left, bottom-right.
     */
    terrain?: [number, number, number, number];

    /** Animation data */
    animation?: ITileAnimFrame[];

    /** Image to render, set when this is an imagelayer */
    image?: string;

    /** Image height, set when this is an imagelayer */
    imageheight?: number;

    /** Image width, set when this is an imagelayer */
    imagewidth?: number;
}

export interface ITerrain
{
    /** Name of terrain */
    name: string;

    /** Local ID of tile representing terrain (int) */
    tile: number;
}

/**
 * Interface representing a Tiled tileset.
 * See: http://doc.mapeditor.org/en/latest/reference/json-map-format/
 *
 * The "since" comments in the docs below are Tiled versions not versions of
 * this library.
 */
export default interface ITileset
{
    /** GID corresponding to the first tile in the set */
    firstgid: number;

    /** Image used for tiles in this set */
    image: string;

    /** Name given to this tileset */
    name: string;

    /** Maximum width of tiles in this set (int) */
    tilewidth: number;

    /** Maximum height of tiles in this set (int) */
    tileheight: number;

    /** Width of source image in pixels (int) */
    imagewidth: number;

    /** Height of source image in pixels (int) */
    imageheight: number;

    /** String key-value pairs */
    properties: TMap<string>;

    /** String key-value pairs */
    propertytypes: TMap<string>;

    /** Buffer between image edge and first tile (pixels) (int) */
    margin: number;

    /** Spacing between adjacent tiles in image (pixels) (int) */
    spacing: number;

    /** Per-tile properties, indexed by gid as string */
    tileproperties: TMap<string>;

    /** The number of tile columns in the tileset (int) */
    columns: number;

    /** The number of tiles in this tileset (int) */
    tilecount: number;

    /** If set this refers to an external file that holds the tileset information (optional) */
    source?: string;

    /** Array of Terrains (optional) */
    terrains?: ITerrain[];

    /** Gid-indexed Tiles (optional) */
    tiles?: TMap<ITile>;
}
