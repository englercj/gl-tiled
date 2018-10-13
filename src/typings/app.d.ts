interface IAssets
{
    [key: string]: (TexImageSource | { data: TexImageSource });
}

interface IPoint
{
    x: number;
    y: number;
}

interface IReadonlyArray<T>
{
    readonly length: number;
    readonly [n: number]: T;
}

type TCallback = () => void;
type TCallback1<T1> = (arg1: T1) => void;
type TCallback2<T1, T2> = (arg1: T1, arg2: T2) => void;
type TCallback3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => void;

type TMap<T> = { [key: string]: T };

declare module '*.vert' { var src: string; export default src; }
declare module '*.frag' { var src: string; export default src; }
declare module '*.glsl' { var src: string; export default src; }
