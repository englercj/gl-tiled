const fs = require('fs');
const PNG = require('pngjs').PNG;

const numTiles = 16;
const tileSize = 512;
const paddedTileSize = 514;
const paddingSize = paddedTileSize - tileSize;

let progress = 0;

console.log('Loading file...');

fs.createReadStream('all.png')
    .pipe(new PNG())
    .on('parsed', function ()
    {
        const totalTiles = numTiles * numTiles;
        let finishedTiles = 0;
        let lastProg = -1;

        console.log(`File loaded, allocating new image...`);

        const newImg = new PNG({ width: tileSize * numTiles, height: tileSize * numTiles });

        console.log(`New image allocated, extracting ${totalTiles} tiles...`);

        for (var y = 0; y < numTiles; ++y)
        {
            for (var x = 0; x < numTiles; ++x)
            {
                const sx = (x * paddedTileSize) + 1;
                const sy = (y * paddedTileSize) + 1;

                this.bitblt(newImg,
                    sx, sy,
                    tileSize, tileSize,
                    (x * tileSize), (y * tileSize)
                );

                finishedTiles++;

                const prog = Math.floor((finishedTiles / totalTiles) * 100);
                if ((prog % 10) === 0 && prog != lastProg)
                {
                    lastProg = prog;
                    console.log(`Progress: ${prog}%`);
                }
            }
        }

        newImg.pack().pipe(fs.createWriteStream('all-small.png'));
    });
