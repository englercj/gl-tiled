export function parseColorStr(colorStr: string, outColor: Float32Array)
{
    if (colorStr)
    {
        if (colorStr.length === 9)
        {
            outColor[0] = parseInt(colorStr.substr(3, 2), 16) / 255;
            outColor[1] = parseInt(colorStr.substr(5, 2), 16) / 255;
            outColor[2] = parseInt(colorStr.substr(7, 2), 16) / 255;
            outColor[3] = parseInt(colorStr.substr(1, 2), 16) / 255;
        }
        else if (colorStr.length === 7)
        {
            outColor[0] = parseInt(colorStr.substr(1, 2), 16) / 255;
            outColor[1] = parseInt(colorStr.substr(3, 2), 16) / 255;
            outColor[2] = parseInt(colorStr.substr(5, 2), 16) / 255;
            outColor[3] = 1.0;
        }
    }
}
