export interface IAssets
{
    [key: string]: (TexImageSource | { data: TexImageSource });
}

export interface IPoint
{
    x: number;
    y: number;
}

export type TCallback = () => void;
export type TCallback1<T1> = (arg1: T1) => void;
export type TCallback2<T1, T2> = (arg1: T1, arg2: T2) => void;
export type TCallback3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => void;

export type IDictionary<T> = Partial<{ [key: string]: T }>;
