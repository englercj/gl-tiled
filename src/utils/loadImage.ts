import { IAssets, TCallback2 } from '../typings/types';

export function loadImage(url: string, cache: IAssets, cb: TCallback2<ErrorEvent, TexImageSource>): TexImageSource
{
    const asset = cache && cache[url];
    let img: TexImageSource = null;

    if (asset)
    {
        img = (asset as any).data || asset;
    }

    if (img)
    {
        cb(null, img);
    }
    else
    {
        img = new Image();
        img.src = url;

        img.onload = () =>
        {
            (img as HTMLImageElement).onload = null;
            (img as HTMLImageElement).onerror = null;

            if (cb)
                cb(null, img);
        };

        img.onerror = (e: ErrorEvent) =>
        {
            (img as HTMLImageElement).onload = null;
            (img as HTMLImageElement).onerror = null;

            if (cb)
                cb(e, img);
        };
    }

    return img;
}