export interface IAssets {
    [key: string]: (TexImageSource | {
        data: TexImageSource;
    });
}
export interface IPoint {
    x: number;
    y: number;
}
export declare type TCallback = () => void;
export declare type TCallback1<T1> = (arg1: T1) => void;
export declare type TCallback2<T1, T2> = (arg1: T1, arg2: T2) => void;
export declare type TCallback3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => void;
export declare type IDictionary<T> = Partial<{
    [key: string]: T;
}>;
