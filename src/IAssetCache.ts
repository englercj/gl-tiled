export interface IAssetCache
{
    [key: string]: (TexImageSource | { data: TexImageSource });
}
