import IObjectBase from './objects';

/**
 * Interface representing a Tiled layer.
 * See: http://doc.mapeditor.org/en/latest/reference/json-map-format/#layer
 */
export interface ITilelayerBase
{
    /** Column count. Same as map width for fixed-size maps. (int) */
    width: number;

    /** Row count. Same as map height for fixed-size maps. (int) */
    height: number;

    /** Name assigned to this layer */
    name: string;

    /** 'tilelayer', 'objectgroup', or 'imagelayer' */
    type: ('tilelayer' | 'objectgroup' | 'imagelayer');

    /** Whether layer is shown or hidden in editor */
    visible: boolean;

    /** Horizontal layer offset in tiles. Always 0. (int) */
    x: number;

    /** Vertical layer offset in tiles. Always 0. (int) */
    y: number;

    /** string key-value pairs. */
    properties: TMap<string>;

    /** Value between 0 and 1 (float) */
    opacity: number;
}

export interface ITilelayer extends ITilelayerBase
{
    type: 'tilelayer';

    /** Array of GIDs. tilelayer only. (int) */
    data: number[];
}

export interface IObjectlayer extends ITilelayerBase
{
    type: 'objectgroup';

    /** Array of Objects. objectgroup only. */
    objects: IObject[];

    /** 'topdown' (default) or 'index'. objectgroup only. */
    draworder: ('topdown' | 'index');
}

export interface IImagelayer extends ITilelayerBase
{
    type: 'imagelayer';

    /** The url to the image source for the layer */
    image: string;
}

type ILayer = (ITilelayer | IObjectlayer | IImagelayer);

export default ILayer;
