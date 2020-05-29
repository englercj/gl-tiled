export interface IPropertyBase {
    /** The name of the property. */
    name: string;
    /** The type of the property. */
    type: 'string' | 'int' | 'float' | 'bool' | 'color' | 'file';
    /**
     * The value of the property. Type depends on what the `type` property is.
     */
    value: boolean | string | number;
}
export interface IStringProperty extends IPropertyBase {
    type: 'string';
    /** The string value */
    value: string;
}
export interface IIntProperty extends IPropertyBase {
    type: 'int';
    /** The integer value */
    value: number;
}
export interface IFloatProperty extends IPropertyBase {
    type: 'float';
    /** The floating-point value */
    value: number;
}
export interface IBoolProperty extends IPropertyBase {
    type: 'bool';
    /** The boolean value. */
    value: boolean;
}
export interface IColorProperty extends IPropertyBase {
    type: 'color';
    /** Hex-formatted color (#RRGGBBAA). */
    value: string;
}
export interface IFileProperty extends IPropertyBase {
    type: 'file';
    /** Relative path to the file. */
    value: string;
}
export declare type IProperty = IStringProperty | IIntProperty | IFloatProperty | IBoolProperty | IColorProperty | IFileProperty;
