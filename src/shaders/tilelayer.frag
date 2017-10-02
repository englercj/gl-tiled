precision mediump float;

// TODO: There is a bit too much branching here, need to try and simplify a bit

#pragma NUM_TILESETS
#pragma NUM_TILESET_IMAGES

varying vec2 vPixelCoord;
varying vec2 vTexureCoord;

uniform sampler2D uLayer;
uniform sampler2D uTilesets[NUM_TILESET_IMAGES];

uniform vec2 uTilesetTileSize[NUM_TILESET_IMAGES];
uniform vec2 uInverseTilesetTextureSize[NUM_TILESET_IMAGES];
uniform float uAlpha;
uniform int uRepeatTiles;

const float Flag_FlippedAntiDiagonal = 2.0;
const float Flag_FlippedVertical = 4.0;
const float Flag_FlippedHorizontal = 8.0;
const vec4 c_one4 = vec4(1.0, 1.0, 1.0, 1.0);

// returns 1.0 if flag is set, 0.0 is not
float hasFlag(float value, float flag)
{
    float byteVal = 1.0;

    // early out in trivial cases
    if (value == 0.0)
        return 0.0;

    // Only 4 since our highest flag is `8`, so we only need to check 4 bits
    for (int i = 0; i < 4; ++i)
    {
        if (mod(value, 2.0) > 0.0 && mod(flag, 2.0) > 0.0)
            return 1.0;

        value = floor(value / 2.0);
        flag = floor(flag / 2.0);

        if (!(value > 0.0 && flag > 0.0))
            return 0.0;
    }

    return 0.0;
}

vec2 getTilesetTileSize(int index)
{
    for (int i = 0; i < NUM_TILESET_IMAGES; ++i)
        if (i == index)
            return uTilesetTileSize[i];

    return vec2(0.0, 0.0);
}

vec4 getColor(int index, vec2 coord)
{
    for (int i = 0; i < NUM_TILESET_IMAGES; ++i)
    {
        if (i == index)
        {
            return texture2D(uTilesets[i], coord * uInverseTilesetTextureSize[i]);
        }
    }

    return vec4(0.0, 0.0, 0.0, 0.0);
}

void main()
{
    if (uRepeatTiles == 0 && (vTexureCoord.x < 0.0 || vTexureCoord.x > 1.0 || vTexureCoord.y < 0.0 || vTexureCoord.y > 1.0))
        discard;

    vec4 tile = texture2D(uLayer, vTexureCoord);

    if (tile == c_one4)
        discard;

    float flipFlags = floor(tile.w * 255.0);

    // 0 when not set, 1 when the flag is set. Easy to use as a multiplier
    // int isFlippedAD = (flipFlags & Flag_FlippedAntiDiagonal) >> 1;
    // int isFlippedY = (flipFlags & Flag_FlippedVertical) >> 2;
    // int isFlippedX = (flipFlags & Flag_FlippedHorizontal) >> 3;

    float isFlippedAD = hasFlag(flipFlags, Flag_FlippedAntiDiagonal);
    float isFlippedY = hasFlag(flipFlags, Flag_FlippedVertical);
    float isFlippedX = hasFlag(flipFlags, Flag_FlippedHorizontal);

    int imgIndex = int(floor(tile.z * 255.0));
    vec2 tileSize = getTilesetTileSize(imgIndex);

    vec2 tileOffset = floor(tile.xy * 255.0) * tileSize;
    vec2 tileCoord = mod(vPixelCoord, tileSize);
    vec2 tileCoordFlipped = abs((tileSize * vec2(isFlippedX, isFlippedY)) - tileCoord);

    // if isFlippedAD is set, this will flip the x/y coords
    if (isFlippedAD == 1.0)
    {
        float x = tileCoordFlipped.x;
        tileCoordFlipped.x = tileCoordFlipped.y;
        tileCoordFlipped.y = x;
    }

    gl_FragColor = getColor(imgIndex, tileCoordFlipped + tileOffset) * vec4(1.0, 1.0, 1.0, uAlpha);
}
