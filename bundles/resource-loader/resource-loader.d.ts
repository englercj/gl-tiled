
declare class Loader
{
    constructor(baseUrl: string, concurrency?: number);

    add(options: Loader.IResourceOptions[], cb?: Function): Loader;
    add(urls: string[], cb?: Function): Loader;

    add(url: string, options: Loader.IResourceOptions, cb: Function): Loader;
    add(url: string, options: Loader.IResourceOptions): Loader;
    add(url: string, cb: Function): Loader;
    add(url: string): Loader;

    add(name: string, url: string, options: Loader.IResourceOptions, cb: Function): Loader;
    add(name: string, url: string, options: Loader.IResourceOptions): Loader;
    add(name: string, url: string, cb: Function): Loader;
    add(name: string, url: string): Loader;

    pre(fn: Function): Loader;
    use(fn: Function): Loader;

    reset(): Loader;

    load(cb?: Function): Loader;

    concurrency: number;

    baseUrl: string;
    progress: number;
    loading: boolean;
    defaultQueryString: string;
    resources: { [key: string]: Loader.Resource };

    onProgress: Loader._MiniSignal;
    onError: Loader._MiniSignal;
    onLoad: Loader._MiniSignal;
    onStart: Loader._MiniSignal;
    onComplete: Loader._MiniSignal;
}

declare module Loader
{
    interface IResourceOptions
    {
        name?: string;
        key?: string;
        url?: string;

        callback?: Function;
        onComplete?: Function;

        parentResource?: Resource;

        crossOrigin?: string|boolean;
        loadType?: number;
        xhrType?: string;
        metadata?: any;
    }

    class Resource
    {
        static setExtensionLoadType(extname: string, loadType: number): void;
        static setExtensionXhrType(extname: string, xhrType: string): void;

        static STATUS_FLAGS: {
            NONE:       0,
            DATA_URL:   1,
            COMPLETE:   2,
            LOADING:    4,
        };
        static TYPE: {
            UNKNOWN:    0,
            JSON:       1,
            XML:        2,
            IMAGE:      3,
            AUDIO:      4,
            VIDEO:      5,
            TEXT:       6,
        };
        static LOAD_TYPE: {
            XHR:    1,
            IMAGE:  2,
            AUDIO:  3,
            VIDEO:  4,
        };
        static XHR_RESPONSE_TYPE: {
            DEFAULT:    'text',
            BUFFER:     'arraybuffer',
            BLOB:       'blob',
            DOCUMENT:   'document',
            JSON:       'json',
            TEXT:       'text',
        };

        constructor(name: string, url: string, options?: IResourceOptions);

        complete(): void;
        abort(message: string): void;
        load(cb?: Function): void;

        name: string;
        url: string;
        extension: string;
        data: any;
        crossOrigin: string;
        xhrType: number;
        metadata: any;

        readonly error: Error;
        readonly xhr: XMLHttpRequest;
        readonly children: Resource[];
        readonly type: number;
        readonly progressChunk: number;

        readonly isDataUrl: boolean;
        readonly isComplete: boolean;
        readonly isLoading: boolean;

        onStart: _MiniSignal;
        onProgress: _MiniSignal;
        onComplete: _MiniSignal;
        onAfterMiddleware: _MiniSignal;
    }

    class _MiniSignal {
        constructor();
        handlers(exists?: boolean): _MiniSignal.MiniSignalBinding[] | boolean;
        has(node: _MiniSignal.MiniSignalBinding): boolean;
        dispatch(...args: any[]): boolean;
        add(fn: Function, thisArg?: any): _MiniSignal.MiniSignalBinding;
        once(fn: Function, thisArg?: any): _MiniSignal.MiniSignalBinding;
        detach(node: _MiniSignal.MiniSignalBinding): _MiniSignal;
        detachAll(): _MiniSignal;
    }

    namespace _MiniSignal {
        interface MiniSignalBinding {
            detach(): boolean;
        }
    }
}
