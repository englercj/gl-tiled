import { TObject } from './objects';
import { TMap } from '../typings/types';
export interface ITilelayerBase {
    name: string;
    type: ('tilelayer' | 'objectgroup' | 'imagelayer');
    visible: boolean;
    x: number;
    y: number;
    offsetx: number;
    offsety: number;
    properties: TMap<string>;
    opacity: number;
}
export interface ITilelayer extends ITilelayerBase {
    type: 'tilelayer';
    data: number[];
    width: number;
    height: number;
}
export interface IObjectlayer extends ITilelayerBase {
    type: 'objectgroup';
    objects: TObject[];
    draworder: ('topdown' | 'index');
}
export interface IImagelayer extends ITilelayerBase {
    type: 'imagelayer';
    image: string;
    transparentcolor: string;
}
export declare type TLayer = (ITilelayer | IObjectlayer | IImagelayer);
