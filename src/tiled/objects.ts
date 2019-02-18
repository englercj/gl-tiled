import { IPoint } from '../IPoint';
import { IProperty } from './IProperty';
import { ITileset } from './Tileset';

export interface IObjectTemplate
{
    /** Type of the template, always 'template'. */
    type: 'template';

    /** External tileset used by the template (optional) */
    tileset?: ITileset;

    /** The object instantiated by this template */
    object: IObject;
}

export interface IObjectTemplateInstance
{
    /** Incremental id - unique across all objects (int) */
    id: number;

    /** Relative path to a template file, in case object is a template instance */
    template: string;

    /** Whether object is shown in editor. Default: true */
    visible?: boolean;

    /** x coordinate in pixels (int) */
    x: number;

    /** y coordinate in pixels (int) */
    y: number;
}

/**
 * See: http://doc.mapeditor.org/en/latest/reference/json-map-format/#object
 */
export interface IObjectBase
{
    /** Height in pixels. Ignored if using a gid. (int) */
    height: number;

    /** Incremental id - unique across all objects (int) */
    id: number;

    /** String assigned to name field in editor */
    name: string;

    /** A list of properties (name, value, type) */
    properties?: IProperty[];

    /** Angle in degrees clockwise (float) */
    rotation: number;

    /** String assigned to type field in editor */
    type: string;

    /** Whether object is shown in editor. */
    visible: boolean;

    /** Width in pixels. Ignored if using a gid. (int) */
    width: number;

    /** x coordinate in pixels (int) */
    x: number;

    /** y coordinate in pixels (int) */
    y: number;
}

export interface ITileObject extends IObjectBase
{
    /** GID, only if object comes from a Tilemap (int) */
    gid: number;
}

export interface IEllipseObject extends IObjectBase
{
    /** Used to mark an object as an ellipse */
    ellipse: true;
}

export interface IRectangleObject extends IObjectBase
{

}

export interface IPointObject extends IObjectBase
{
    /** Used to mark an object as a point */
    point: true;
}

export interface IPolygonObject extends IObjectBase
{
    /** A list of x,y coordinates in pixels */
    polygon: IPoint[];
}

export interface IPolylineObject extends IObjectBase
{
    /** A list of x,y coordinates in pixels */
    polyline: IPoint[];
}

export interface ITextOptions
{
    /** Is the font bold? Default: false */
    bold?: boolean;

    /** Hex-formatted color (#RRGGBB or #AARRGGBB). Default: #FF000000 */
    color?: string;

    /** System font family name. Default: 'sans-serif' */
    fontfamily?: string;

    /** Horizontal alignment of the text. Default: 'left' */
    halign?: 'left' | 'center' | 'right' | 'justify';

    /** Should the text be italicized? Default: false */
    italic?: boolean;

    /** Should the text be kerned? Default: true */
    kerning?: boolean;

    /** Font size. (int) Default: 16 */
    pixelsize?: number;

    /** Should a line be drawn through the text? Default: false */
    strikeout?: boolean;

    /** The text to be displayed. */
    text: string;

    /** Should the text be underlined? Default: false */
    underline?: boolean;

    /** Vertical alignment of the text. Default: 'top' */
    valign?: 'top' | 'center' | 'bottom';

    /** Should the text be word wrapped? Default: false */
    wrap?: boolean;
}

export interface ITextObject extends IObjectBase
{
    /** String key-value pairs */
    text: ITextOptions;
}

export type IObject = IObjectTemplateInstance | ITileObject | IEllipseObject | IRectangleObject | IPointObject | IPolygonObject | IPolylineObject | ITextObject;
