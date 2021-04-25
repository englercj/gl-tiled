import { IObject } from './objects';
import { IProperty } from './IProperty';

export interface ITilelayerChunk
{
    /** Array of unsigned int (GIDs) or base64-encoded data */
    data: number[] | string;

    /** Height in tiles (int) */
    height: number;

    /** Width in tiles (int) */
    width: number;

    /** X coordinate in tiles (int) */
    x: number;

    /** Y coordinate in tiles (int) */
    y: number;
}

/**
 * Interface representing a Tiled layer.
 * See: http://doc.mapeditor.org/en/latest/reference/json-map-format/#layer
 */
export interface ILayerBase
{
    /** Incremental id - unique across all layers */
    id: number

    /** Name assigned to this layer */
    name: string;

    /** Horizontal layer offset in pixels. (double) */
    offsetx?: number;

    /** Vertical layer offset in pixels. (double) */
    offsety?: number;

    /** Value between 0 and 1 (double) */
    opacity: number;

    /** A list of properties (name, value, type). */
    properties: IProperty[];

    /** X coordinate where layer content starts (for infinite maps) (int) */
    startx?: number;

    /** Y coordinate where layer content starts (for infinite maps) (int) */
    starty?: number;

    /** tilelayer, objectgroup, imagelayer or group */
    type: 'tilelayer' | 'objectgroup' | 'imagelayer' | 'group';

    /** Whether layer is shown or hidden in editor */
    visible: boolean;

    /** Horizontal layer offset in tiles. Always 0. (int) */
    x: 0;

    /** Vertical layer offset in tiles. Always 0. (int) */
    y: 0;
}

export interface ITilelayer extends ILayerBase
{
    type: 'tilelayer';

    /** Array of chunks (optional). */
    chunks?: ITilelayerChunk[];

    /** zlib, gzip or empty (default). */
    compression?: 'zlib' | 'gzip' | 'zstd';

    /** csv (default) or base64. */
    encoding?: 'csv' | 'base64';

    /** Row count. Same as map height for fixed-size maps. (int) */
    height: number;

    /** Array of unsigned int (GIDs) or base64-encoded data. */
    data: number[] | string;

    /** Column count. Same as map width for fixed-size maps. (int) */
    width: number;
}

export interface IObjectgroup extends ILayerBase
{
    type: 'objectgroup';

    /**
     * Whether the objects are drawn according to the order of
     * appearance (index) or sorted by their y-coordinate (topdown).
     * Defaults to topdown.
     */
    draworder: 'topdown' | 'index';

    /** Array of Objects. objectgroup only. */
    objects: IObject[];
}

export interface IImagelayer extends ILayerBase
{
    type: 'imagelayer';

    /** Image used by this layer. */
    image: string;

    /** Hex-formatted color (#RRGGBB) */
    transparentcolor?: string;
}

export interface ILayergroup extends ILayerBase
{
    type: 'group';

    /** Array of layers. */
    layers: ILayer[];
}

export type ILayer = ITilelayer | IObjectgroup | IImagelayer | ILayergroup;
