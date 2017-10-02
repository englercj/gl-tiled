/**
 * See: http://doc.mapeditor.org/en/latest/reference/json-map-format/#object
 */
export default interface IObjectBase
{
    /** Incremental id - unique across all objects (int) */
    id: number;

    /** Width in pixels. Ignored if using a gid. (int) */
    width: number;

    /** Height in pixels. Ignored if using a gid. (int) */
    height: number;

    /** String assigned to name field in editor */
    name: string;

    /** String assigned to type field in editor */
    type: string;

    /** String key-value pairs */
    properties: TMap<string>;

    /** Whether object is shown in editor. */
    visible: boolean;

    /** x coordinate in pixels (int) */
    x: number;

    /** y coordinate in pixels (int) */
    y: number;

    /** Angle in degrees clockwise (float) */
    rotation: number;
}

export interface IObject extends IObjectBase
{
    /** GID, only if object comes from a Tilemap (int) */
    gid: number;
}

export interface IEllipse extends IObjectBase
{
    /** Used to mark an object as an ellipse */
    ellipse: true;
}

export interface IRectangle extends IObjectBase
{

}

export interface IPolygon extends IObjectBase
{
    /** A list of x,y coordinates in pixels */
    polygon: IPoint[];
}

export interface IPolyline extends IObjectBase
{
    /** A list of x,y coordinates in pixels */
    polyline: IPoint[];
}

export interface IText extends IObjectBase
{
    /** String key-value pairs */
    text: TMap<string>;
}
