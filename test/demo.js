var resourceUrls = [
    // Some LTTP test maps
    'maps/lttp/lightworld/lightworld.json',
    'maps/lttp/minimaps/dw_minimap.json',
    'maps/lttp/minimaps/lw_minimap.json',
    'maps/lttp/overworld/all-small.json',

    // Orthogonal test maps
    'maps/ortho/basicRotate.json',
    // 'maps/ortho/formosa_gzip.json',
    // 'maps/ortho/formosa_zlib.json',
    'maps/ortho/Ortho_1_16__16_large.json',
    'maps/ortho/Ortho_1_32__32.json',
    'maps/ortho/Ortho_1_32__32_objects.json',

    // Isometric test maps
    // 'maps/iso/Isometric_32x16_nooffset.json',
    // 'maps/iso/Isometric_32x16_with_offset_x.json',
    // 'maps/iso/Isometric_32x16_with_offset_x_y_even.json',
    // 'maps/iso/Isometric_32x16_with_offset_x_y_odd.json',
    // 'maps/iso/Isometric_64_32_with_offset_y.json',
    // 'maps/iso/Isometric_64_32_with_offset_y_evensize.json',
    // 'maps/iso/Isometric_cubes.json',
    // 'maps/iso/Isometric_cubes_large.json',
    // 'maps/iso/Isometric_cubes_with_objects.json',
    // 'maps/iso/Isometric_cubes_with_objects_large.json',
    // 'maps/iso/Isometric_land.json',
];
var stats = new Stats();
var loader = new Loader();
var maps = {};

loader.use(tiledMiddlewareFactory());
loader.add(resourceUrls);
loader.load(onLoad);

var offset = [0, 0];
var lastTime = 0;

var switchElm = null;
var dbgTextElm = null;
var canvasElm = null;
var gl = null;
var resizeTimeout = 0;
var tileMap = null;

var halfWidth = 0;
var halfHeight = 0;

var zoomLevels = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8];
var zoomIndex = 4;
var zooming = false;
var zoomPrev = 4;
var zoomNext = 4;
var zoomProgress = 0;
var zoomTime = 250;

function getParameterByName(name, url) {
    if (!url)
        url = window.location.href;

    name = name.replace(/[\[\]]/g, '\\$&');

    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(url);

    if (!results)
        return null;

    if (!results[2])
        return '';

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function onLoad()
{
    // initialize!
    switchElm = document.getElementById('switch');
    dbgTextElm = document.getElementById('debug-txt');
    canvasElm = document.getElementById('view');
    gl = canvasElm.getContext('webgl');

    stats.dom.style.left = '';
    stats.dom.style.right = '300px';
    document.body.appendChild(stats.dom);

    var mapQueryParam = getParameterByName('map');
    var lastOptgroup = null;

    // TODO: Create options in switchElm select.
    for (var i = 0; i < resourceUrls.length; ++i)
    {
        var url = resourceUrls[i];
        var urlParts = url.split('/');
        var folder = urlParts[1];
        var filename = urlParts[urlParts.length - 1];

        if (!lastOptgroup || lastOptgroup.label !== folder)
        {
            if (lastOptgroup)
                switchElm.appendChild(lastOptgroup);

            lastOptgroup = document.createElement('optgroup');
            lastOptgroup.label = folder;
        }

        var opt = document.createElement('option');

        opt.value = url;
        opt.textContent = filename;
        opt.selected = url === mapQueryParam;

        lastOptgroup.appendChild(opt);
    }

    if (lastOptgroup)
        switchElm.appendChild(lastOptgroup);

    window.addEventListener('resize', onResize);
    switchElm.addEventListener('change', onMapChange, false);

    if (switchElm.value) onMapChange();
    else switchElm.selectedIndex = 0;

    doResize();
    draw((lastTime = performance.now()));

    var tracking = false;
    var lastX, lastY;

    canvasElm.addEventListener('mousedown', function (e)
    {
        tracking = true;
        lastX = e.pageX;
        lastY = e.pageY;
    });

    canvasElm.addEventListener('mousemove', function (e)
    {
        if (tracking) {
            pan(e.pageX - lastX, e.pageY - lastY);

            lastX = e.pageX;
            lastY = e.pageY;
        }
    });

    canvasElm.addEventListener('mouseup', function (e)
    {
        tracking = false;
    });

    canvasElm.addEventListener('mouseout', function (e)
    {
        tracking = false;
    });

    canvasElm.addEventListener('mousewheel', function (e)
    {
        e.preventDefault();
        zoom(e.wheelDeltaY);
    });

    canvasElm.addEventListener('DOMMouseScroll', function (e)
    {
        e.preventDefault();
        zoom(e.wheelDeltaY);
    });
}

function onMapChange()
{
    var mapUrl = switchElm.value;

    if (tileMap)
        tileMap.glTerminate();

    if (!maps[mapUrl])
    {
        tileMap = maps[mapUrl] = new glTiled.Tilemap(gl, loader.resources[mapUrl].data, loader.resources);
        tileMap.repeatTiles = false;
    }
    else
    {
        tileMap = maps[mapUrl];
        tileMap.glInitialize(gl);
    }

    tileMap.resizeViewport(canvasElm.width, canvasElm.height);

    history.pushState(null, '', '?map=' + encodeURIComponent(mapUrl));
}

function zoom(zoomDelta)
{
    if (!zooming)
    {
        zoomIndex += (zoomDelta > 0 ? 1 : -1);

        if (zoomIndex < 0) zoomIndex = 0;
        if (zoomIndex >= zoomLevels.length) zoomIndex = zoomLevels.length - 1;

        zoomPrev = tileMap.tileScale;
        zoomNext = zoomLevels[zoomIndex];
        zoomProgress = 0;

        if (zoomPrev != zoomNext)
        {
            zooming = true;
        }
    }
}

function onResize()
{
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(doResize, 200);
}

function doResize()
{
    canvasElm.width = canvasElm.offsetWidth;
    canvasElm.height = canvasElm.offsetHeight;

    halfWidth = canvasElm.width / 2.0;
    halfHeight = canvasElm.height / 2.0;

    gl.viewport(0, 0, canvasElm.width, canvasElm.height);

    tileMap.resizeViewport(canvasElm.width, canvasElm.height);
}

function clampToWorld(o)
{
    var mapWidth = tileMap.desc.width * tileMap.desc.tilewidth;
    var mapHeight = tileMap.desc.height * tileMap.desc.tileheight;

    var maxOffsetX = mapWidth - tileMap.scaledViewportWidth;
    var maxOffsetY = mapHeight - tileMap.scaledViewportHeight;

    // clamp to max
    if (o[0] > maxOffsetX) o[0] = maxOffsetX;
    if (o[1] > maxOffsetY) o[1] = maxOffsetY;

    // clamp to min
    if (o[0] < 0) o[0] = 0;
    if (o[1] < 0) o[1] = 0;
}

function pan(x, y)
{
    if (zooming)
        return;

    offset[0] -= x / tileMap.tileScale;
    offset[1] -= y / tileMap.tileScale;

    clampToWorld(offset);
}

function draw(now)
{
    requestAnimationFrame(draw);
    var dt = now - lastTime;
    lastTime = now;

    if (zooming)
    {
        zoomProgress += (dt / zoomTime);

        if (zoomProgress >= 1)
        {
            zoomProgress = 1;
            zooming = false;

            tileMap.tileScale = zoomNext;
        }
        else
        {
            var prev = tileMap.tileScale;
            var next = zoomPrev + zoomProgress * (zoomNext - zoomPrev);

            tileMap.tileScale = next;
        }

        clampToWorld(offset);
    }

    dbgTextElm.textContent = `
offset: (${offset[0].toFixed(3)}, ${offset[1].toFixed(3)})
scale: ${tileMap.tileScale.toFixed(3)}
`;

    stats.begin();
    tileMap.update(dt); // update animations
    tileMap.draw(offset[0], offset[1]); // draw!
    stats.end();
}
