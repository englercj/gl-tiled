export function loadImage(url: string, cache: IAssets, cb: TCallback2<ErrorEvent, CanvasImageSource>): CanvasImageSource
{
    const asset = cache && cache[url];
    let img: CanvasImageSource = null;

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

        img.onerror = (e) =>
        {
            (img as HTMLImageElement).onload = null;
            (img as HTMLImageElement).onerror = null;

            if (cb)
                cb(e, img);
        };
    }

    return img;
}