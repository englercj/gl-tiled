export interface IAssets {
    [key: string]: (TexImageSource | {
        data: TexImageSource;
    });
}
