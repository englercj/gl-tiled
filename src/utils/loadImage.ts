import { IAssets } from '../IAssets';

export type TErrorEventCallback<T> = (error: ErrorEvent | null, arg: T) => void;

export function loadImage(url: string, cache?: IAssets, cb?: TErrorEventCallback<TexImageSource>): TexImageSource
{
    const asset = cache && cache[url];

    if (asset)
    {
        const img = (asset as any).data || asset;

        if (cb)
            cb(null, img);

        return img;
    }

    const onLoadHandler = () =>
    {
        img.removeEventListener('load', onLoadHandler, false);
        img.removeEventListener('error', onErrorHandler, false);

        if (cb)
            cb(null, img);
    };

    const onErrorHandler = (e: ErrorEvent) =>
    {
        img.removeEventListener('load', onLoadHandler, false);
        img.removeEventListener('error', onErrorHandler, false);

        if (cb)
            cb(e, img);
    };

    const img = new Image();
    img.src = url;

    img.addEventListener('load', onLoadHandler, false);
    img.addEventListener('error', onErrorHandler, false);

    return img;
}
