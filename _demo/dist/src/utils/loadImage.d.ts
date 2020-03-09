import { IAssetCache } from '../IAssetCache';
export declare type TErrorEventCallback<T> = (error: ErrorEvent | null, arg: T) => void;
export declare function loadImage(url: string, cache?: IAssetCache, cb?: TErrorEventCallback<TexImageSource>): TexImageSource;
