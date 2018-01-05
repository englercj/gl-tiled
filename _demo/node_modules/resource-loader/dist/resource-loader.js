(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Loader = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _miniSignals = require('mini-signals');

var _miniSignals2 = _interopRequireDefault(_miniSignals);

var _parseUri = require('parse-uri');

var _parseUri2 = _interopRequireDefault(_parseUri);

var _async = require('./async');

var async = _interopRequireWildcard(_async);

var _Resource = require('./Resource');

var _Resource2 = _interopRequireDefault(_Resource);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// some constants
var MAX_PROGRESS = 100;
var rgxExtractUrlHash = /(#[\w-]+)?$/;

/**
 * Manages the state and loading of multiple resources to load.
 *
 * @class
 */

var Loader = function () {
    /**
     * @param {string} [baseUrl=''] - The base url for all resources loaded by this loader.
     * @param {number} [concurrency=10] - The number of resources to load concurrently.
     */
    function Loader() {
        var _this = this;

        var baseUrl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
        var concurrency = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

        _classCallCheck(this, Loader);

        /**
         * The base url for all resources loaded by this loader.
         *
         * @member {string}
         */
        this.baseUrl = baseUrl;

        /**
         * The progress percent of the loader going through the queue.
         *
         * @member {number}
         */
        this.progress = 0;

        /**
         * Loading state of the loader, true if it is currently loading resources.
         *
         * @member {boolean}
         */
        this.loading = false;

        /**
         * A querystring to append to every URL added to the loader.
         *
         * This should be a valid query string *without* the question-mark (`?`). The loader will
         * also *not* escape values for you. Make sure to escape your parameters with
         * [`encodeURIComponent`](https://mdn.io/encodeURIComponent) before assigning this property.
         *
         * @example
         * const loader = new Loader();
         *
         * loader.defaultQueryString = 'user=me&password=secret';
         *
         * // This will request 'image.png?user=me&password=secret'
         * loader.add('image.png').load();
         *
         * loader.reset();
         *
         * // This will request 'image.png?v=1&user=me&password=secret'
         * loader.add('iamge.png?v=1').load();
         */
        this.defaultQueryString = '';

        /**
         * The middleware to run before loading each resource.
         *
         * @member {function[]}
         */
        this._beforeMiddleware = [];

        /**
         * The middleware to run after loading each resource.
         *
         * @member {function[]}
         */
        this._afterMiddleware = [];

        /**
         * The tracks the resources we are currently completing parsing for.
         *
         * @member {Resource[]}
         */
        this._resourcesParsing = [];

        /**
         * The `_loadResource` function bound with this object context.
         *
         * @private
         * @member {function}
         * @param {Resource} r - The resource to load
         * @param {Function} d - The dequeue function
         * @return {undefined}
         */
        this._boundLoadResource = function (r, d) {
            return _this._loadResource(r, d);
        };

        /**
         * The resources waiting to be loaded.
         *
         * @private
         * @member {Resource[]}
         */
        this._queue = async.queue(this._boundLoadResource, concurrency);

        this._queue.pause();

        /**
         * All the resources for this loader keyed by name.
         *
         * @member {object<string, Resource>}
         */
        this.resources = {};

        /**
         * Dispatched once per loaded or errored resource.
         *
         * The callback looks like {@link Loader.OnProgressSignal}.
         *
         * @member {Signal}
         */
        this.onProgress = new _miniSignals2.default();

        /**
         * Dispatched once per errored resource.
         *
         * The callback looks like {@link Loader.OnErrorSignal}.
         *
         * @member {Signal}
         */
        this.onError = new _miniSignals2.default();

        /**
         * Dispatched once per loaded resource.
         *
         * The callback looks like {@link Loader.OnLoadSignal}.
         *
         * @member {Signal}
         */
        this.onLoad = new _miniSignals2.default();

        /**
         * Dispatched when the loader begins to process the queue.
         *
         * The callback looks like {@link Loader.OnStartSignal}.
         *
         * @member {Signal}
         */
        this.onStart = new _miniSignals2.default();

        /**
         * Dispatched when the queued resources all load.
         *
         * The callback looks like {@link Loader.OnCompleteSignal}.
         *
         * @member {Signal}
         */
        this.onComplete = new _miniSignals2.default();

        /**
         * When the progress changes the loader and resource are disaptched.
         *
         * @memberof Loader
         * @callback OnProgressSignal
         * @param {Loader} loader - The loader the progress is advancing on.
         * @param {Resource} resource - The resource that has completed or failed to cause the progress to advance.
         */

        /**
         * When an error occurrs the loader and resource are disaptched.
         *
         * @memberof Loader
         * @callback OnErrorSignal
         * @param {Loader} loader - The loader the error happened in.
         * @param {Resource} resource - The resource that caused the error.
         */

        /**
         * When a load completes the loader and resource are disaptched.
         *
         * @memberof Loader
         * @callback OnLoadSignal
         * @param {Loader} loader - The loader that laoded the resource.
         * @param {Resource} resource - The resource that has completed loading.
         */

        /**
         * When the loader starts loading resources it dispatches this callback.
         *
         * @memberof Loader
         * @callback OnStartSignal
         * @param {Loader} loader - The loader that has started loading resources.
         */

        /**
         * When the loader completes loading resources it dispatches this callback.
         *
         * @memberof Loader
         * @callback OnCompleteSignal
         * @param {Loader} loader - The loader that has finished loading resources.
         */
    }

    /**
     * Adds a resource (or multiple resources) to the loader queue.
     *
     * This function can take a wide variety of different parameters. The only thing that is always
     * required the url to load. All the following will work:
     *
     * ```js
     * loader
     *     // normal param syntax
     *     .add('key', 'http://...', function () {})
     *     .add('http://...', function () {})
     *     .add('http://...')
     *
     *     // object syntax
     *     .add({
     *         name: 'key2',
     *         url: 'http://...'
     *     }, function () {})
     *     .add({
     *         url: 'http://...'
     *     }, function () {})
     *     .add({
     *         name: 'key3',
     *         url: 'http://...'
     *         onComplete: function () {}
     *     })
     *     .add({
     *         url: 'https://...',
     *         onComplete: function () {},
     *         crossOrigin: true
     *     })
     *
     *     // you can also pass an array of objects or urls or both
     *     .add([
     *         { name: 'key4', url: 'http://...', onComplete: function () {} },
     *         { url: 'http://...', onComplete: function () {} },
     *         'http://...'
     *     ])
     *
     *     // and you can use both params and options
     *     .add('key', 'http://...', { crossOrigin: true }, function () {})
     *     .add('http://...', { crossOrigin: true }, function () {});
     * ```
     *
     * @param {string} [name] - The name of the resource to load, if not passed the url is used.
     * @param {string} [url] - The url for this resource, relative to the baseUrl of this loader.
     * @param {object} [options] - The options for the load.
     * @param {boolean} [options.crossOrigin] - Is this request cross-origin? Default is to determine automatically.
     * @param {Resource.LOAD_TYPE} [options.loadType=Resource.LOAD_TYPE.XHR] - How should this resource be loaded?
     * @param {Resource.XHR_RESPONSE_TYPE} [options.xhrType=Resource.XHR_RESPONSE_TYPE.DEFAULT] - How should
     *      the data being loaded be interpreted when using XHR?
     * @param {object} [options.metadata] - Extra configuration for middleware and the Resource object.
     * @param {HTMLImageElement|HTMLAudioElement|HTMLVideoElement} [options.metadata.loadElement=null] - The
     *      element to use for loading, instead of creating one.
     * @param {boolean} [options.metadata.skipSource=false] - Skips adding source(s) to the load element. This
     *      is useful if you want to pass in a `loadElement` that you already added load sources to.
     * @param {function} [cb] - Function to call when this specific resource completes loading.
     * @return {Loader} Returns itself.
     */


    Loader.prototype.add = function add(name, url, options, cb) {
        // special case of an array of objects or urls
        if (Array.isArray(name)) {
            for (var i = 0; i < name.length; ++i) {
                this.add(name[i]);
            }

            return this;
        }

        // if an object is passed instead of params
        if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
            cb = url || name.callback || name.onComplete;
            options = name;
            url = name.url;
            name = name.name || name.key || name.url;
        }

        // case where no name is passed shift all args over by one.
        if (typeof url !== 'string') {
            cb = options;
            options = url;
            url = name;
        }

        // now that we shifted make sure we have a proper url.
        if (typeof url !== 'string') {
            throw new Error('No url passed to add resource to loader.');
        }

        // options are optional so people might pass a function and no options
        if (typeof options === 'function') {
            cb = options;
            options = null;
        }

        // if loading already you can only add resources that have a parent.
        if (this.loading && (!options || !options.parentResource)) {
            throw new Error('Cannot add resources while the loader is running.');
        }

        // check if resource already exists.
        if (this.resources[name]) {
            throw new Error('Resource named "' + name + '" already exists.');
        }

        // add base url if this isn't an absolute url
        url = this._prepareUrl(url);

        // create the store the resource
        this.resources[name] = new _Resource2.default(name, url, options);

        if (typeof cb === 'function') {
            this.resources[name].onAfterMiddleware.once(cb);
        }

        // if actively loading, make sure to adjust progress chunks for that parent and its children
        if (this.loading) {
            var parent = options.parentResource;
            var incompleteChildren = [];

            for (var _i = 0; _i < parent.children.length; ++_i) {
                if (!parent.children[_i].isComplete) {
                    incompleteChildren.push(parent.children[_i]);
                }
            }

            var fullChunk = parent.progressChunk * (incompleteChildren.length + 1); // +1 for parent
            var eachChunk = fullChunk / (incompleteChildren.length + 2); // +2 for parent & new child

            parent.children.push(this.resources[name]);
            parent.progressChunk = eachChunk;

            for (var _i2 = 0; _i2 < incompleteChildren.length; ++_i2) {
                incompleteChildren[_i2].progressChunk = eachChunk;
            }

            this.resources[name].progressChunk = eachChunk;
        }

        // add the resource to the queue
        this._queue.push(this.resources[name]);

        return this;
    };

    /**
     * Sets up a middleware function that will run *before* the
     * resource is loaded.
     *
     * @method before
     * @param {function} fn - The middleware function to register.
     * @return {Loader} Returns itself.
     */


    Loader.prototype.pre = function pre(fn) {
        this._beforeMiddleware.push(fn);

        return this;
    };

    /**
     * Sets up a middleware function that will run *after* the
     * resource is loaded.
     *
     * @alias use
     * @method after
     * @param {function} fn - The middleware function to register.
     * @return {Loader} Returns itself.
     */


    Loader.prototype.use = function use(fn) {
        this._afterMiddleware.push(fn);

        return this;
    };

    /**
     * Resets the queue of the loader to prepare for a new load.
     *
     * @return {Loader} Returns itself.
     */


    Loader.prototype.reset = function reset() {
        this.progress = 0;
        this.loading = false;

        this._queue.kill();
        this._queue.pause();

        // abort all resource loads
        for (var k in this.resources) {
            var res = this.resources[k];

            if (res._onLoadBinding) {
                res._onLoadBinding.detach();
            }

            if (res.isLoading) {
                res.abort();
            }
        }

        this.resources = {};

        return this;
    };

    /**
     * Starts loading the queued resources.
     *
     * @param {function} [cb] - Optional callback that will be bound to the `complete` event.
     * @return {Loader} Returns itself.
     */


    Loader.prototype.load = function load(cb) {
        // register complete callback if they pass one
        if (typeof cb === 'function') {
            this.onComplete.once(cb);
        }

        // if the queue has already started we are done here
        if (this.loading) {
            return this;
        }

        if (this._queue.idle()) {
            this._onStart();
            this._onComplete();
        } else {
            // distribute progress chunks
            var numTasks = this._queue._tasks.length;
            var chunk = 100 / numTasks;

            for (var i = 0; i < this._queue._tasks.length; ++i) {
                this._queue._tasks[i].data.progressChunk = chunk;
            }

            // notify we are starting
            this._onStart();

            // start loading
            this._queue.resume();
        }

        return this;
    };

    /**
     * The number of resources to load concurrently.
     *
     * @member {number}
     * @default 10
     */


    /**
     * Prepares a url for usage based on the configuration of this object
     *
     * @private
     * @param {string} url - The url to prepare.
     * @return {string} The prepared url.
     */
    Loader.prototype._prepareUrl = function _prepareUrl(url) {
        var parsedUrl = (0, _parseUri2.default)(url, { strictMode: true });
        var result = void 0;

        // absolute url, just use it as is.
        if (parsedUrl.protocol || !parsedUrl.path || url.indexOf('//') === 0) {
            result = url;
        }
        // if baseUrl doesn't end in slash and url doesn't start with slash, then add a slash inbetween
        else if (this.baseUrl.length && this.baseUrl.lastIndexOf('/') !== this.baseUrl.length - 1 && url.charAt(0) !== '/') {
                result = this.baseUrl + '/' + url;
            } else {
                result = this.baseUrl + url;
            }

        // if we need to add a default querystring, there is a bit more work
        if (this.defaultQueryString) {
            var hash = rgxExtractUrlHash.exec(result)[0];

            result = result.substr(0, result.length - hash.length);

            if (result.indexOf('?') !== -1) {
                result += '&' + this.defaultQueryString;
            } else {
                result += '?' + this.defaultQueryString;
            }

            result += hash;
        }

        return result;
    };

    /**
     * Loads a single resource.
     *
     * @private
     * @param {Resource} resource - The resource to load.
     * @param {function} dequeue - The function to call when we need to dequeue this item.
     */


    Loader.prototype._loadResource = function _loadResource(resource, dequeue) {
        var _this2 = this;

        resource._dequeue = dequeue;

        // run before middleware
        async.eachSeries(this._beforeMiddleware, function (fn, next) {
            fn.call(_this2, resource, function () {
                // if the before middleware marks the resource as complete,
                // break and don't process any more before middleware
                next(resource.isComplete ? {} : null);
            });
        }, function () {
            if (resource.isComplete) {
                _this2._onLoad(resource);
            } else {
                resource._onLoadBinding = resource.onComplete.once(_this2._onLoad, _this2);
                resource.load();
            }
        }, true);
    };

    /**
     * Called once loading has started.
     *
     * @private
     */


    Loader.prototype._onStart = function _onStart() {
        this.progress = 0;
        this.loading = true;
        this.onStart.dispatch(this);
    };

    /**
     * Called once each resource has loaded.
     *
     * @private
     */


    Loader.prototype._onComplete = function _onComplete() {
        this.progress = MAX_PROGRESS;
        this.loading = false;
        this.onComplete.dispatch(this, this.resources);
    };

    /**
     * Called each time a resources is loaded.
     *
     * @private
     * @param {Resource} resource - The resource that was loaded
     */


    Loader.prototype._onLoad = function _onLoad(resource) {
        var _this3 = this;

        resource._onLoadBinding = null;

        // remove this resource from the async queue, and add it to our list of resources that are being parsed
        this._resourcesParsing.push(resource);
        resource._dequeue();

        // run all the after middleware for this resource
        async.eachSeries(this._afterMiddleware, function (fn, next) {
            fn.call(_this3, resource, next);
        }, function () {
            resource.onAfterMiddleware.dispatch(resource);

            _this3.progress += resource.progressChunk;
            _this3.onProgress.dispatch(_this3, resource);

            if (resource.error) {
                _this3.onError.dispatch(resource.error, _this3, resource);
            } else {
                _this3.onLoad.dispatch(_this3, resource);
            }

            _this3._resourcesParsing.splice(_this3._resourcesParsing.indexOf(resource), 1);

            // do completion check
            if (_this3._queue.idle() && _this3._resourcesParsing.length === 0) {
                _this3._onComplete();
            }
        }, true);
    };

    _createClass(Loader, [{
        key: 'concurrency',
        get: function get() {
            return this._queue.concurrency;
        }
        // eslint-disable-next-line require-jsdoc
        ,
        set: function set(concurrency) {
            this._queue.concurrency = concurrency;
        }
    }]);

    return Loader;
}();

exports.default = Loader;

},{"./Resource":2,"./async":3,"mini-signals":6,"parse-uri":7}],2:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _parseUri = require('parse-uri');

var _parseUri2 = _interopRequireDefault(_parseUri);

var _miniSignals = require('mini-signals');

var _miniSignals2 = _interopRequireDefault(_miniSignals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// tests is CORS is supported in XHR, if not we need to use XDR
var useXdr = !!(window.XDomainRequest && !('withCredentials' in new XMLHttpRequest()));
var tempAnchor = null;

// some status constants
var STATUS_NONE = 0;
var STATUS_OK = 200;
var STATUS_EMPTY = 204;
var STATUS_IE_BUG_EMPTY = 1223;
var STATUS_TYPE_OK = 2;

// noop
function _noop() {} /* empty */

/**
 * Manages the state and loading of a resource and all child resources.
 *
 * @class
 */

var Resource = function () {
    /**
     * Sets the load type to be used for a specific extension.
     *
     * @static
     * @param {string} extname - The extension to set the type for, e.g. "png" or "fnt"
     * @param {Resource.LOAD_TYPE} loadType - The load type to set it to.
     */
    Resource.setExtensionLoadType = function setExtensionLoadType(extname, loadType) {
        setExtMap(Resource._loadTypeMap, extname, loadType);
    };

    /**
     * Sets the load type to be used for a specific extension.
     *
     * @static
     * @param {string} extname - The extension to set the type for, e.g. "png" or "fnt"
     * @param {Resource.XHR_RESPONSE_TYPE} xhrType - The xhr type to set it to.
     */


    Resource.setExtensionXhrType = function setExtensionXhrType(extname, xhrType) {
        setExtMap(Resource._xhrTypeMap, extname, xhrType);
    };

    /**
     * @param {string} name - The name of the resource to load.
     * @param {string|string[]} url - The url for this resource, for audio/video loads you can pass
     *      an array of sources.
     * @param {object} [options] - The options for the load.
     * @param {string|boolean} [options.crossOrigin] - Is this request cross-origin? Default is to
     *      determine automatically.
     * @param {Resource.LOAD_TYPE} [options.loadType=Resource.LOAD_TYPE.XHR] - How should this resource
     *      be loaded?
     * @param {Resource.XHR_RESPONSE_TYPE} [options.xhrType=Resource.XHR_RESPONSE_TYPE.DEFAULT] - How
     *      should the data being loaded be interpreted when using XHR?
     * @param {object} [options.metadata] - Extra configuration for middleware and the Resource object.
     * @param {HTMLImageElement|HTMLAudioElement|HTMLVideoElement} [options.metadata.loadElement=null] - The
     *      element to use for loading, instead of creating one.
     * @param {boolean} [options.metadata.skipSource=false] - Skips adding source(s) to the load element. This
     *      is useful if you want to pass in a `loadElement` that you already added load sources to.
     * @param {string|string[]} [options.metadata.mimeType] - The mime type to use for the source element of a video/audio
     *      elment. If the urls are an array, you can pass this as an array as well where each index is the mime type to
     *      use for the corresponding url index.
     */


    function Resource(name, url, options) {
        _classCallCheck(this, Resource);

        if (typeof name !== 'string' || typeof url !== 'string') {
            throw new Error('Both name and url are required for constructing a resource.');
        }

        options = options || {};

        /**
         * The state flags of this resource.
         *
         * @member {number}
         */
        this._flags = 0;

        // set data url flag, needs to be set early for some _determineX checks to work.
        this._setFlag(Resource.STATUS_FLAGS.DATA_URL, url.indexOf('data:') === 0);

        /**
         * The name of this resource.
         *
         * @member {string}
         * @readonly
         */
        this.name = name;

        /**
         * The url used to load this resource.
         *
         * @member {string}
         * @readonly
         */
        this.url = url;

        /**
         * The extension used to load this resource.
         *
         * @member {string}
         * @readonly
         */
        this.extension = this._getExtension();

        /**
         * The data that was loaded by the resource.
         *
         * @member {any}
         */
        this.data = null;

        /**
         * Is this request cross-origin? If unset, determined automatically.
         *
         * @member {string}
         */
        this.crossOrigin = options.crossOrigin === true ? 'anonymous' : options.crossOrigin;

        /**
         * The method of loading to use for this resource.
         *
         * @member {Resource.LOAD_TYPE}
         */
        this.loadType = options.loadType || this._determineLoadType();

        /**
         * The type used to load the resource via XHR. If unset, determined automatically.
         *
         * @member {string}
         */
        this.xhrType = options.xhrType;

        /**
         * Extra info for middleware, and controlling specifics about how the resource loads.
         *
         * Note that if you pass in a `loadElement`, the Resource class takes ownership of it.
         * Meaning it will modify it as it sees fit.
         *
         * @member {object}
         * @property {HTMLImageElement|HTMLAudioElement|HTMLVideoElement} [loadElement=null] - The
         *  element to use for loading, instead of creating one.
         * @property {boolean} [skipSource=false] - Skips adding source(s) to the load element. This
         *  is useful if you want to pass in a `loadElement` that you already added load sources
         *  to.
         */
        this.metadata = options.metadata || {};

        /**
         * The error that occurred while loading (if any).
         *
         * @member {Error}
         * @readonly
         */
        this.error = null;

        /**
         * The XHR object that was used to load this resource. This is only set
         * when `loadType` is `Resource.LOAD_TYPE.XHR`.
         *
         * @member {XMLHttpRequest}
         * @readonly
         */
        this.xhr = null;

        /**
         * The child resources this resource owns.
         *
         * @member {Resource[]}
         * @readonly
         */
        this.children = [];

        /**
         * The resource type.
         *
         * @member {Resource.TYPE}
         * @readonly
         */
        this.type = Resource.TYPE.UNKNOWN;

        /**
         * The progress chunk owned by this resource.
         *
         * @member {number}
         * @readonly
         */
        this.progressChunk = 0;

        /**
         * The `dequeue` method that will be used a storage place for the async queue dequeue method
         * used privately by the loader.
         *
         * @private
         * @member {function}
         */
        this._dequeue = _noop;

        /**
         * Used a storage place for the on load binding used privately by the loader.
         *
         * @private
         * @member {function}
         */
        this._onLoadBinding = null;

        /**
         * The `complete` function bound to this resource's context.
         *
         * @private
         * @member {function}
         */
        this._boundComplete = this.complete.bind(this);

        /**
         * The `_onError` function bound to this resource's context.
         *
         * @private
         * @member {function}
         */
        this._boundOnError = this._onError.bind(this);

        /**
         * The `_onProgress` function bound to this resource's context.
         *
         * @private
         * @member {function}
         */
        this._boundOnProgress = this._onProgress.bind(this);

        // xhr callbacks
        this._boundXhrOnError = this._xhrOnError.bind(this);
        this._boundXhrOnAbort = this._xhrOnAbort.bind(this);
        this._boundXhrOnLoad = this._xhrOnLoad.bind(this);
        this._boundXdrOnTimeout = this._xdrOnTimeout.bind(this);

        /**
         * Dispatched when the resource beings to load.
         *
         * The callback looks like {@link Resource.OnStartSignal}.
         *
         * @member {Signal}
         */
        this.onStart = new _miniSignals2.default();

        /**
         * Dispatched each time progress of this resource load updates.
         * Not all resources types and loader systems can support this event
         * so sometimes it may not be available. If the resource
         * is being loaded on a modern browser, using XHR, and the remote server
         * properly sets Content-Length headers, then this will be available.
         *
         * The callback looks like {@link Resource.OnProgressSignal}.
         *
         * @member {Signal}
         */
        this.onProgress = new _miniSignals2.default();

        /**
         * Dispatched once this resource has loaded, if there was an error it will
         * be in the `error` property.
         *
         * The callback looks like {@link Resource.OnCompleteSignal}.
         *
         * @member {Signal}
         */
        this.onComplete = new _miniSignals2.default();

        /**
         * Dispatched after this resource has had all the *after* middleware run on it.
         *
         * The callback looks like {@link Resource.OnCompleteSignal}.
         *
         * @member {Signal}
         */
        this.onAfterMiddleware = new _miniSignals2.default();

        /**
         * When the resource starts to load.
         *
         * @memberof Resource
         * @callback OnStartSignal
         * @param {Resource} resource - The resource that the event happened on.
         */

        /**
         * When the resource reports loading progress.
         *
         * @memberof Resource
         * @callback OnProgressSignal
         * @param {Resource} resource - The resource that the event happened on.
         * @param {number} percentage - The progress of the load in the range [0, 1].
         */

        /**
         * When the resource finishes loading.
         *
         * @memberof Resource
         * @callback OnCompleteSignal
         * @param {Resource} resource - The resource that the event happened on.
         */
    }

    /**
     * Stores whether or not this url is a data url.
     *
     * @member {boolean}
     * @readonly
     */


    /**
     * Marks the resource as complete.
     *
     */
    Resource.prototype.complete = function complete() {
        // TODO: Clean this up in a wrapper or something...gross....
        if (this.data && this.data.removeEventListener) {
            this.data.removeEventListener('error', this._boundOnError, false);
            this.data.removeEventListener('load', this._boundComplete, false);
            this.data.removeEventListener('progress', this._boundOnProgress, false);
            this.data.removeEventListener('canplaythrough', this._boundComplete, false);
        }

        if (this.xhr) {
            if (this.xhr.removeEventListener) {
                this.xhr.removeEventListener('error', this._boundXhrOnError, false);
                this.xhr.removeEventListener('abort', this._boundXhrOnAbort, false);
                this.xhr.removeEventListener('progress', this._boundOnProgress, false);
                this.xhr.removeEventListener('load', this._boundXhrOnLoad, false);
            } else {
                this.xhr.onerror = null;
                this.xhr.ontimeout = null;
                this.xhr.onprogress = null;
                this.xhr.onload = null;
            }
        }

        if (this.isComplete) {
            throw new Error('Complete called again for an already completed resource.');
        }

        this._setFlag(Resource.STATUS_FLAGS.COMPLETE, true);
        this._setFlag(Resource.STATUS_FLAGS.LOADING, false);

        this.onComplete.dispatch(this);
    };

    /**
     * Aborts the loading of this resource, with an optional message.
     *
     * @param {string} message - The message to use for the error
     */


    Resource.prototype.abort = function abort(message) {
        // abort can be called multiple times, ignore subsequent calls.
        if (this.error) {
            return;
        }

        // store error
        this.error = new Error(message);

        // abort the actual loading
        if (this.xhr) {
            this.xhr.abort();
        } else if (this.xdr) {
            this.xdr.abort();
        } else if (this.data) {
            // single source
            if (this.data.src) {
                this.data.src = Resource.EMPTY_GIF;
            }
            // multi-source
            else {
                    while (this.data.firstChild) {
                        this.data.removeChild(this.data.firstChild);
                    }
                }
        }

        // done now.
        this.complete();
    };

    /**
     * Kicks off loading of this resource. This method is asynchronous.
     *
     * @param {function} [cb] - Optional callback to call once the resource is loaded.
     */


    Resource.prototype.load = function load(cb) {
        var _this = this;

        if (this.isLoading) {
            return;
        }

        if (this.isComplete) {
            if (cb) {
                setTimeout(function () {
                    return cb(_this);
                }, 1);
            }

            return;
        } else if (cb) {
            this.onComplete.once(cb);
        }

        this._setFlag(Resource.STATUS_FLAGS.LOADING, true);

        this.onStart.dispatch(this);

        // if unset, determine the value
        if (this.crossOrigin === false || typeof this.crossOrigin !== 'string') {
            this.crossOrigin = this._determineCrossOrigin(this.url);
        }

        switch (this.loadType) {
            case Resource.LOAD_TYPE.IMAGE:
                this.type = Resource.TYPE.IMAGE;
                this._loadElement('image');
                break;

            case Resource.LOAD_TYPE.AUDIO:
                this.type = Resource.TYPE.AUDIO;
                this._loadSourceElement('audio');
                break;

            case Resource.LOAD_TYPE.VIDEO:
                this.type = Resource.TYPE.VIDEO;
                this._loadSourceElement('video');
                break;

            case Resource.LOAD_TYPE.XHR:
            /* falls through */
            default:
                if (useXdr && this.crossOrigin) {
                    this._loadXdr();
                } else {
                    this._loadXhr();
                }
                break;
        }
    };

    /**
     * Checks if the flag is set.
     *
     * @private
     * @param {number} flag - The flag to check.
     * @return {boolean} True if the flag is set.
     */


    Resource.prototype._hasFlag = function _hasFlag(flag) {
        return !!(this._flags & flag);
    };

    /**
     * (Un)Sets the flag.
     *
     * @private
     * @param {number} flag - The flag to (un)set.
     * @param {boolean} value - Whether to set or (un)set the flag.
     */


    Resource.prototype._setFlag = function _setFlag(flag, value) {
        this._flags = value ? this._flags | flag : this._flags & ~flag;
    };

    /**
     * Loads this resources using an element that has a single source,
     * like an HTMLImageElement.
     *
     * @private
     * @param {string} type - The type of element to use.
     */


    Resource.prototype._loadElement = function _loadElement(type) {
        if (this.metadata.loadElement) {
            this.data = this.metadata.loadElement;
        } else if (type === 'image' && typeof window.Image !== 'undefined') {
            this.data = new Image();
        } else {
            this.data = document.createElement(type);
        }

        if (this.crossOrigin) {
            this.data.crossOrigin = this.crossOrigin;
        }

        if (!this.metadata.skipSource) {
            this.data.src = this.url;
        }

        this.data.addEventListener('error', this._boundOnError, false);
        this.data.addEventListener('load', this._boundComplete, false);
        this.data.addEventListener('progress', this._boundOnProgress, false);
    };

    /**
     * Loads this resources using an element that has multiple sources,
     * like an HTMLAudioElement or HTMLVideoElement.
     *
     * @private
     * @param {string} type - The type of element to use.
     */


    Resource.prototype._loadSourceElement = function _loadSourceElement(type) {
        if (this.metadata.loadElement) {
            this.data = this.metadata.loadElement;
        } else if (type === 'audio' && typeof window.Audio !== 'undefined') {
            this.data = new Audio();
        } else {
            this.data = document.createElement(type);
        }

        if (this.data === null) {
            this.abort('Unsupported element: ' + type);

            return;
        }

        if (!this.metadata.skipSource) {
            // support for CocoonJS Canvas+ runtime, lacks document.createElement('source')
            if (navigator.isCocoonJS) {
                this.data.src = Array.isArray(this.url) ? this.url[0] : this.url;
            } else if (Array.isArray(this.url)) {
                var mimeTypes = this.metadata.mimeType;

                for (var i = 0; i < this.url.length; ++i) {
                    this.data.appendChild(this._createSource(type, this.url[i], Array.isArray(mimeTypes) ? mimeTypes[i] : mimeTypes));
                }
            } else {
                var _mimeTypes = this.metadata.mimeType;

                this.data.appendChild(this._createSource(type, this.url, Array.isArray(_mimeTypes) ? _mimeTypes[0] : _mimeTypes));
            }
        }

        this.data.addEventListener('error', this._boundOnError, false);
        this.data.addEventListener('load', this._boundComplete, false);
        this.data.addEventListener('progress', this._boundOnProgress, false);
        this.data.addEventListener('canplaythrough', this._boundComplete, false);

        this.data.load();
    };

    /**
     * Loads this resources using an XMLHttpRequest.
     *
     * @private
     */


    Resource.prototype._loadXhr = function _loadXhr() {
        // if unset, determine the value
        if (typeof this.xhrType !== 'string') {
            this.xhrType = this._determineXhrType();
        }

        var xhr = this.xhr = new XMLHttpRequest();

        // set the request type and url
        xhr.open('GET', this.url, true);

        // load json as text and parse it ourselves. We do this because some browsers
        // *cough* safari *cough* can't deal with it.
        if (this.xhrType === Resource.XHR_RESPONSE_TYPE.JSON || this.xhrType === Resource.XHR_RESPONSE_TYPE.DOCUMENT) {
            xhr.responseType = Resource.XHR_RESPONSE_TYPE.TEXT;
        } else {
            xhr.responseType = this.xhrType;
        }

        xhr.addEventListener('error', this._boundXhrOnError, false);
        xhr.addEventListener('abort', this._boundXhrOnAbort, false);
        xhr.addEventListener('progress', this._boundOnProgress, false);
        xhr.addEventListener('load', this._boundXhrOnLoad, false);

        xhr.send();
    };

    /**
     * Loads this resources using an XDomainRequest. This is here because we need to support IE9 (gross).
     *
     * @private
     */


    Resource.prototype._loadXdr = function _loadXdr() {
        // if unset, determine the value
        if (typeof this.xhrType !== 'string') {
            this.xhrType = this._determineXhrType();
        }

        var xdr = this.xhr = new XDomainRequest();

        // XDomainRequest has a few quirks. Occasionally it will abort requests
        // A way to avoid this is to make sure ALL callbacks are set even if not used
        // More info here: http://stackoverflow.com/questions/15786966/xdomainrequest-aborts-post-on-ie-9
        xdr.timeout = 5000;

        xdr.onerror = this._boundXhrOnError;
        xdr.ontimeout = this._boundXdrOnTimeout;
        xdr.onprogress = this._boundOnProgress;
        xdr.onload = this._boundXhrOnLoad;

        xdr.open('GET', this.url, true);

        // Note: The xdr.send() call is wrapped in a timeout to prevent an
        // issue with the interface where some requests are lost if multiple
        // XDomainRequests are being sent at the same time.
        // Some info here: https://github.com/photonstorm/phaser/issues/1248
        setTimeout(function () {
            return xdr.send();
        }, 1);
    };

    /**
     * Creates a source used in loading via an element.
     *
     * @private
     * @param {string} type - The element type (video or audio).
     * @param {string} url - The source URL to load from.
     * @param {string} [mime] - The mime type of the video
     * @return {HTMLSourceElement} The source element.
     */


    Resource.prototype._createSource = function _createSource(type, url, mime) {
        if (!mime) {
            mime = type + '/' + this._getExtension(url);
        }

        var source = document.createElement('source');

        source.src = url;
        source.type = mime;

        return source;
    };

    /**
     * Called if a load errors out.
     *
     * @param {Event} event - The error event from the element that emits it.
     * @private
     */


    Resource.prototype._onError = function _onError(event) {
        this.abort('Failed to load element using: ' + event.target.nodeName);
    };

    /**
     * Called if a load progress event fires for xhr/xdr.
     *
     * @private
     * @param {XMLHttpRequestProgressEvent|Event} event - Progress event.
     */


    Resource.prototype._onProgress = function _onProgress(event) {
        if (event && event.lengthComputable) {
            this.onProgress.dispatch(this, event.loaded / event.total);
        }
    };

    /**
     * Called if an error event fires for xhr/xdr.
     *
     * @private
     * @param {XMLHttpRequestErrorEvent|Event} event - Error event.
     */


    Resource.prototype._xhrOnError = function _xhrOnError() {
        var xhr = this.xhr;

        this.abort(reqType(xhr) + ' Request failed. Status: ' + xhr.status + ', text: "' + xhr.statusText + '"');
    };

    /**
     * Called if an abort event fires for xhr.
     *
     * @private
     * @param {XMLHttpRequestAbortEvent} event - Abort Event
     */


    Resource.prototype._xhrOnAbort = function _xhrOnAbort() {
        this.abort(reqType(this.xhr) + ' Request was aborted by the user.');
    };

    /**
     * Called if a timeout event fires for xdr.
     *
     * @private
     * @param {Event} event - Timeout event.
     */


    Resource.prototype._xdrOnTimeout = function _xdrOnTimeout() {
        this.abort(reqType(this.xhr) + ' Request timed out.');
    };

    /**
     * Called when data successfully loads from an xhr/xdr request.
     *
     * @private
     * @param {XMLHttpRequestLoadEvent|Event} event - Load event
     */


    Resource.prototype._xhrOnLoad = function _xhrOnLoad() {
        var xhr = this.xhr;
        var text = '';
        var status = typeof xhr.status === 'undefined' ? STATUS_OK : xhr.status; // XDR has no `.status`, assume 200.

        // responseText is accessible only if responseType is '' or 'text' and on older browsers
        if (xhr.responseType === '' || xhr.responseType === 'text' || typeof xhr.responseType === 'undefined') {
            text = xhr.responseText;
        }

        // status can be 0 when using the `file://` protocol so we also check if a response is set.
        // If it has a response, we assume 200; otherwise a 0 status code with no contents is an aborted request.
        if (status === STATUS_NONE && (text.length > 0 || xhr.responseType === Resource.XHR_RESPONSE_TYPE.BUFFER)) {
            status = STATUS_OK;
        }
        // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
        else if (status === STATUS_IE_BUG_EMPTY) {
                status = STATUS_EMPTY;
            }

        var statusType = status / 100 | 0;

        if (statusType === STATUS_TYPE_OK) {
            // if text, just return it
            if (this.xhrType === Resource.XHR_RESPONSE_TYPE.TEXT) {
                this.data = text;
                this.type = Resource.TYPE.TEXT;
            }
            // if json, parse into json object
            else if (this.xhrType === Resource.XHR_RESPONSE_TYPE.JSON) {
                    try {
                        this.data = JSON.parse(text);
                        this.type = Resource.TYPE.JSON;
                    } catch (e) {
                        this.abort('Error trying to parse loaded json: ' + e);

                        return;
                    }
                }
                // if xml, parse into an xml document or div element
                else if (this.xhrType === Resource.XHR_RESPONSE_TYPE.DOCUMENT) {
                        try {
                            if (window.DOMParser) {
                                var domparser = new DOMParser();

                                this.data = domparser.parseFromString(text, 'text/xml');
                            } else {
                                var div = document.createElement('div');

                                div.innerHTML = text;

                                this.data = div;
                            }

                            this.type = Resource.TYPE.XML;
                        } catch (e) {
                            this.abort('Error trying to parse loaded xml: ' + e);

                            return;
                        }
                    }
                    // other types just return the response
                    else {
                            this.data = xhr.response || text;
                        }
        } else {
            this.abort('[' + xhr.status + '] ' + xhr.statusText + ': ' + xhr.responseURL);

            return;
        }

        this.complete();
    };

    /**
     * Sets the `crossOrigin` property for this resource based on if the url
     * for this resource is cross-origin. If crossOrigin was manually set, this
     * function does nothing.
     *
     * @private
     * @param {string} url - The url to test.
     * @param {object} [loc=window.location] - The location object to test against.
     * @return {string} The crossOrigin value to use (or empty string for none).
     */


    Resource.prototype._determineCrossOrigin = function _determineCrossOrigin(url, loc) {
        // data: and javascript: urls are considered same-origin
        if (url.indexOf('data:') === 0) {
            return '';
        }

        // default is window.location
        loc = loc || window.location;

        if (!tempAnchor) {
            tempAnchor = document.createElement('a');
        }

        // let the browser determine the full href for the url of this resource and then
        // parse with the node url lib, we can't use the properties of the anchor element
        // because they don't work in IE9 :(
        tempAnchor.href = url;
        url = (0, _parseUri2.default)(tempAnchor.href, { strictMode: true });

        var samePort = !url.port && loc.port === '' || url.port === loc.port;
        var protocol = url.protocol ? url.protocol + ':' : '';

        // if cross origin
        if (url.host !== loc.hostname || !samePort || protocol !== loc.protocol) {
            return 'anonymous';
        }

        return '';
    };

    /**
     * Determines the responseType of an XHR request based on the extension of the
     * resource being loaded.
     *
     * @private
     * @return {Resource.XHR_RESPONSE_TYPE} The responseType to use.
     */


    Resource.prototype._determineXhrType = function _determineXhrType() {
        return Resource._xhrTypeMap[this.extension] || Resource.XHR_RESPONSE_TYPE.TEXT;
    };

    /**
     * Determines the loadType of a resource based on the extension of the
     * resource being loaded.
     *
     * @private
     * @return {Resource.LOAD_TYPE} The loadType to use.
     */


    Resource.prototype._determineLoadType = function _determineLoadType() {
        return Resource._loadTypeMap[this.extension] || Resource.LOAD_TYPE.XHR;
    };

    /**
     * Extracts the extension (sans '.') of the file being loaded by the resource.
     *
     * @private
     * @return {string} The extension.
     */


    Resource.prototype._getExtension = function _getExtension() {
        var url = this.url;
        var ext = '';

        if (this.isDataUrl) {
            var slashIndex = url.indexOf('/');

            ext = url.substring(slashIndex + 1, url.indexOf(';', slashIndex));
        } else {
            var queryStart = url.indexOf('?');
            var hashStart = url.indexOf('#');
            var index = Math.min(queryStart > -1 ? queryStart : url.length, hashStart > -1 ? hashStart : url.length);

            url = url.substring(0, index);
            ext = url.substring(url.lastIndexOf('.') + 1);
        }

        return ext.toLowerCase();
    };

    /**
     * Determines the mime type of an XHR request based on the responseType of
     * resource being loaded.
     *
     * @private
     * @param {Resource.XHR_RESPONSE_TYPE} type - The type to get a mime type for.
     * @return {string} The mime type to use.
     */


    Resource.prototype._getMimeFromXhrType = function _getMimeFromXhrType(type) {
        switch (type) {
            case Resource.XHR_RESPONSE_TYPE.BUFFER:
                return 'application/octet-binary';

            case Resource.XHR_RESPONSE_TYPE.BLOB:
                return 'application/blob';

            case Resource.XHR_RESPONSE_TYPE.DOCUMENT:
                return 'application/xml';

            case Resource.XHR_RESPONSE_TYPE.JSON:
                return 'application/json';

            case Resource.XHR_RESPONSE_TYPE.DEFAULT:
            case Resource.XHR_RESPONSE_TYPE.TEXT:
            /* falls through */
            default:
                return 'text/plain';

        }
    };

    _createClass(Resource, [{
        key: 'isDataUrl',
        get: function get() {
            return this._hasFlag(Resource.STATUS_FLAGS.DATA_URL);
        }

        /**
         * Describes if this resource has finished loading. Is true when the resource has completely
         * loaded.
         *
         * @member {boolean}
         * @readonly
         */

    }, {
        key: 'isComplete',
        get: function get() {
            return this._hasFlag(Resource.STATUS_FLAGS.COMPLETE);
        }

        /**
         * Describes if this resource is currently loading. Is true when the resource starts loading,
         * and is false again when complete.
         *
         * @member {boolean}
         * @readonly
         */

    }, {
        key: 'isLoading',
        get: function get() {
            return this._hasFlag(Resource.STATUS_FLAGS.LOADING);
        }
    }]);

    return Resource;
}();

/**
 * The types of resources a resource could represent.
 *
 * @static
 * @readonly
 * @enum {number}
 */


exports.default = Resource;
Resource.STATUS_FLAGS = {
    NONE: 0,
    DATA_URL: 1 << 0,
    COMPLETE: 1 << 1,
    LOADING: 1 << 2
};

/**
 * The types of resources a resource could represent.
 *
 * @static
 * @readonly
 * @enum {number}
 */
Resource.TYPE = {
    UNKNOWN: 0,
    JSON: 1,
    XML: 2,
    IMAGE: 3,
    AUDIO: 4,
    VIDEO: 5,
    TEXT: 6
};

/**
 * The types of loading a resource can use.
 *
 * @static
 * @readonly
 * @enum {number}
 */
Resource.LOAD_TYPE = {
    /** Uses XMLHttpRequest to load the resource. */
    XHR: 1,
    /** Uses an `Image` object to load the resource. */
    IMAGE: 2,
    /** Uses an `Audio` object to load the resource. */
    AUDIO: 3,
    /** Uses a `Video` object to load the resource. */
    VIDEO: 4
};

/**
 * The XHR ready states, used internally.
 *
 * @static
 * @readonly
 * @enum {string}
 */
Resource.XHR_RESPONSE_TYPE = {
    /** string */
    DEFAULT: 'text',
    /** ArrayBuffer */
    BUFFER: 'arraybuffer',
    /** Blob */
    BLOB: 'blob',
    /** Document */
    DOCUMENT: 'document',
    /** Object */
    JSON: 'json',
    /** String */
    TEXT: 'text'
};

Resource._loadTypeMap = {
    // images
    gif: Resource.LOAD_TYPE.IMAGE,
    png: Resource.LOAD_TYPE.IMAGE,
    bmp: Resource.LOAD_TYPE.IMAGE,
    jpg: Resource.LOAD_TYPE.IMAGE,
    jpeg: Resource.LOAD_TYPE.IMAGE,
    tif: Resource.LOAD_TYPE.IMAGE,
    tiff: Resource.LOAD_TYPE.IMAGE,
    webp: Resource.LOAD_TYPE.IMAGE,
    tga: Resource.LOAD_TYPE.IMAGE,
    svg: Resource.LOAD_TYPE.IMAGE,
    'svg+xml': Resource.LOAD_TYPE.IMAGE, // for SVG data urls

    // audio
    mp3: Resource.LOAD_TYPE.AUDIO,
    ogg: Resource.LOAD_TYPE.AUDIO,
    wav: Resource.LOAD_TYPE.AUDIO,

    // videos
    mp4: Resource.LOAD_TYPE.VIDEO,
    webm: Resource.LOAD_TYPE.VIDEO
};

Resource._xhrTypeMap = {
    // xml
    xhtml: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    html: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    htm: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    xml: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    tmx: Resource.XHR_RESPONSE_TYPE.DOCUMENT,
    svg: Resource.XHR_RESPONSE_TYPE.DOCUMENT,

    // This was added to handle Tiled Tileset XML, but .tsx is also a TypeScript React Component.
    // Since it is way less likely for people to be loading TypeScript files instead of Tiled files,
    // this should probably be fine.
    tsx: Resource.XHR_RESPONSE_TYPE.DOCUMENT,

    // images
    gif: Resource.XHR_RESPONSE_TYPE.BLOB,
    png: Resource.XHR_RESPONSE_TYPE.BLOB,
    bmp: Resource.XHR_RESPONSE_TYPE.BLOB,
    jpg: Resource.XHR_RESPONSE_TYPE.BLOB,
    jpeg: Resource.XHR_RESPONSE_TYPE.BLOB,
    tif: Resource.XHR_RESPONSE_TYPE.BLOB,
    tiff: Resource.XHR_RESPONSE_TYPE.BLOB,
    webp: Resource.XHR_RESPONSE_TYPE.BLOB,
    tga: Resource.XHR_RESPONSE_TYPE.BLOB,

    // json
    json: Resource.XHR_RESPONSE_TYPE.JSON,

    // text
    text: Resource.XHR_RESPONSE_TYPE.TEXT,
    txt: Resource.XHR_RESPONSE_TYPE.TEXT,

    // fonts
    ttf: Resource.XHR_RESPONSE_TYPE.BUFFER,
    otf: Resource.XHR_RESPONSE_TYPE.BUFFER
};

// We can't set the `src` attribute to empty string, so on abort we set it to this 1px transparent gif
Resource.EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

/**
 * Quick helper to set a value on one of the extension maps. Ensures there is no
 * dot at the start of the extension.
 *
 * @ignore
 * @param {object} map - The map to set on.
 * @param {string} extname - The extension (or key) to set.
 * @param {number} val - The value to set.
 */
function setExtMap(map, extname, val) {
    if (extname && extname.indexOf('.') === 0) {
        extname = extname.substring(1);
    }

    if (!extname) {
        return;
    }

    map[extname] = val;
}

/**
 * Quick helper to get string xhr type.
 *
 * @ignore
 * @param {XMLHttpRequest|XDomainRequest} xhr - The request to check.
 * @return {string} The type.
 */
function reqType(xhr) {
    return xhr.toString().replace('object ', '');
}

},{"mini-signals":6,"parse-uri":7}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.eachSeries = eachSeries;
exports.queue = queue;
/**
 * Smaller version of the async library constructs.
 *
 */
function _noop() {} /* empty */

/**
 * Iterates an array in series.
 *
 * @param {Array.<*>} array - Array to iterate.
 * @param {function} iterator - Function to call for each element.
 * @param {function} callback - Function to call when done, or on error.
 * @param {boolean} [deferNext=false] - Break synchronous each loop by calling next with a setTimeout of 1.
 */
function eachSeries(array, iterator, callback, deferNext) {
    var i = 0;
    var len = array.length;

    (function next(err) {
        if (err || i === len) {
            if (callback) {
                callback(err);
            }

            return;
        }

        if (deferNext) {
            setTimeout(function () {
                iterator(array[i++], next);
            }, 1);
        } else {
            iterator(array[i++], next);
        }
    })();
}

/**
 * Ensures a function is only called once.
 *
 * @param {function} fn - The function to wrap.
 * @return {function} The wrapping function.
 */
function onlyOnce(fn) {
    return function onceWrapper() {
        if (fn === null) {
            throw new Error('Callback was already called.');
        }

        var callFn = fn;

        fn = null;
        callFn.apply(this, arguments);
    };
}

/**
 * Async queue implementation,
 *
 * @param {function} worker - The worker function to call for each task.
 * @param {number} concurrency - How many workers to run in parrallel.
 * @return {*} The async queue object.
 */
function queue(worker, concurrency) {
    if (concurrency == null) {
        // eslint-disable-line no-eq-null,eqeqeq
        concurrency = 1;
    } else if (concurrency === 0) {
        throw new Error('Concurrency must not be zero');
    }

    var workers = 0;
    var q = {
        _tasks: [],
        concurrency: concurrency,
        saturated: _noop,
        unsaturated: _noop,
        buffer: concurrency / 4,
        empty: _noop,
        drain: _noop,
        error: _noop,
        started: false,
        paused: false,
        push: function push(data, callback) {
            _insert(data, false, callback);
        },
        kill: function kill() {
            workers = 0;
            q.drain = _noop;
            q.started = false;
            q._tasks = [];
        },
        unshift: function unshift(data, callback) {
            _insert(data, true, callback);
        },
        process: function process() {
            while (!q.paused && workers < q.concurrency && q._tasks.length) {
                var task = q._tasks.shift();

                if (q._tasks.length === 0) {
                    q.empty();
                }

                workers += 1;

                if (workers === q.concurrency) {
                    q.saturated();
                }

                worker(task.data, onlyOnce(_next(task)));
            }
        },
        length: function length() {
            return q._tasks.length;
        },
        running: function running() {
            return workers;
        },
        idle: function idle() {
            return q._tasks.length + workers === 0;
        },
        pause: function pause() {
            if (q.paused === true) {
                return;
            }

            q.paused = true;
        },
        resume: function resume() {
            if (q.paused === false) {
                return;
            }

            q.paused = false;

            // Need to call q.process once per concurrent
            // worker to preserve full concurrency after pause
            for (var w = 1; w <= q.concurrency; w++) {
                q.process();
            }
        }
    };

    function _insert(data, insertAtFront, callback) {
        if (callback != null && typeof callback !== 'function') {
            // eslint-disable-line no-eq-null,eqeqeq
            throw new Error('task callback must be a function');
        }

        q.started = true;

        if (data == null && q.idle()) {
            // eslint-disable-line no-eq-null,eqeqeq
            // call drain immediately if there are no tasks
            setTimeout(function () {
                return q.drain();
            }, 1);

            return;
        }

        var item = {
            data: data,
            callback: typeof callback === 'function' ? callback : _noop
        };

        if (insertAtFront) {
            q._tasks.unshift(item);
        } else {
            q._tasks.push(item);
        }

        setTimeout(function () {
            return q.process();
        }, 1);
    }

    function _next(task) {
        return function next() {
            workers -= 1;

            task.callback.apply(task, arguments);

            if (arguments[0] != null) {
                // eslint-disable-line no-eq-null,eqeqeq
                q.error(arguments[0], task.data);
            }

            if (workers <= q.concurrency - q.buffer) {
                q.unsaturated();
            }

            if (q.idle()) {
                q.drain();
            }

            q.process();
        };
    }

    return q;
}

},{}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.encodeBinary = encodeBinary;
var _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function encodeBinary(input) {
    var output = '';
    var inx = 0;

    while (inx < input.length) {
        // Fill byte buffer array
        var bytebuffer = [0, 0, 0];
        var encodedCharIndexes = [0, 0, 0, 0];

        for (var jnx = 0; jnx < bytebuffer.length; ++jnx) {
            if (inx < input.length) {
                // throw away high-order byte, as documented at:
                // https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data
                bytebuffer[jnx] = input.charCodeAt(inx++) & 0xff;
            } else {
                bytebuffer[jnx] = 0;
            }
        }

        // Get each encoded character, 6 bits at a time
        // index 1: first 6 bits
        encodedCharIndexes[0] = bytebuffer[0] >> 2;

        // index 2: second 6 bits (2 least significant bits from input byte 1 + 4 most significant bits from byte 2)
        encodedCharIndexes[1] = (bytebuffer[0] & 0x3) << 4 | bytebuffer[1] >> 4;

        // index 3: third 6 bits (4 least significant bits from input byte 2 + 2 most significant bits from byte 3)
        encodedCharIndexes[2] = (bytebuffer[1] & 0x0f) << 2 | bytebuffer[2] >> 6;

        // index 3: forth 6 bits (6 least significant bits from input byte 3)
        encodedCharIndexes[3] = bytebuffer[2] & 0x3f;

        // Determine whether padding happened, and adjust accordingly
        var paddingBytes = inx - (input.length - 1);

        switch (paddingBytes) {
            case 2:
                // Set last 2 characters to padding char
                encodedCharIndexes[3] = 64;
                encodedCharIndexes[2] = 64;
                break;

            case 1:
                // Set last character to padding char
                encodedCharIndexes[3] = 64;
                break;

            default:
                break; // No padding - proceed
        }

        // Now we will grab each appropriate character out of our keystring
        // based on our index array and append it to the output string
        for (var _jnx = 0; _jnx < encodedCharIndexes.length; ++_jnx) {
            output += _keyStr.charAt(encodedCharIndexes[_jnx]);
        }
    }

    return output;
}

},{}],5:[function(require,module,exports){
'use strict';

// import Loader from './Loader';
// import Resource from './Resource';
// import * as async from './async';
// import * as b64 from './b64';

/* eslint-disable no-undef */

var Loader = require('./Loader').default;
var Resource = require('./Resource').default;
var async = require('./async');
var b64 = require('./b64');

Loader.Resource = Resource;
Loader.async = async;
Loader.base64 = b64;

// export manually, and also as default
module.exports = Loader;
// export default Loader;
module.exports.default = Loader;

},{"./Loader":1,"./Resource":2,"./async":3,"./b64":4}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var MiniSignalBinding = (function () {
  function MiniSignalBinding(fn, once, thisArg) {
    if (once === undefined) once = false;

    _classCallCheck(this, MiniSignalBinding);

    this._fn = fn;
    this._once = once;
    this._thisArg = thisArg;
    this._next = this._prev = this._owner = null;
  }

  _createClass(MiniSignalBinding, [{
    key: 'detach',
    value: function detach() {
      if (this._owner === null) return false;
      this._owner.detach(this);
      return true;
    }
  }]);

  return MiniSignalBinding;
})();

function _addMiniSignalBinding(self, node) {
  if (!self._head) {
    self._head = node;
    self._tail = node;
  } else {
    self._tail._next = node;
    node._prev = self._tail;
    self._tail = node;
  }

  node._owner = self;

  return node;
}

var MiniSignal = (function () {
  function MiniSignal() {
    _classCallCheck(this, MiniSignal);

    this._head = this._tail = undefined;
  }

  _createClass(MiniSignal, [{
    key: 'handlers',
    value: function handlers() {
      var exists = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      var node = this._head;

      if (exists) return !!node;

      var ee = [];

      while (node) {
        ee.push(node);
        node = node._next;
      }

      return ee;
    }
  }, {
    key: 'has',
    value: function has(node) {
      if (!(node instanceof MiniSignalBinding)) {
        throw new Error('MiniSignal#has(): First arg must be a MiniSignalBinding object.');
      }

      return node._owner === this;
    }
  }, {
    key: 'dispatch',
    value: function dispatch() {
      var node = this._head;

      if (!node) return false;

      while (node) {
        if (node._once) this.detach(node);
        node._fn.apply(node._thisArg, arguments);
        node = node._next;
      }

      return true;
    }
  }, {
    key: 'add',
    value: function add(fn) {
      var thisArg = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      if (typeof fn !== 'function') {
        throw new Error('MiniSignal#add(): First arg must be a Function.');
      }
      return _addMiniSignalBinding(this, new MiniSignalBinding(fn, false, thisArg));
    }
  }, {
    key: 'once',
    value: function once(fn) {
      var thisArg = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      if (typeof fn !== 'function') {
        throw new Error('MiniSignal#once(): First arg must be a Function.');
      }
      return _addMiniSignalBinding(this, new MiniSignalBinding(fn, true, thisArg));
    }
  }, {
    key: 'detach',
    value: function detach(node) {
      if (!(node instanceof MiniSignalBinding)) {
        throw new Error('MiniSignal#detach(): First arg must be a MiniSignalBinding object.');
      }
      if (node._owner !== this) return this;

      if (node._prev) node._prev._next = node._next;
      if (node._next) node._next._prev = node._prev;

      if (node === this._head) {
        this._head = node._next;
        if (node._next === null) {
          this._tail = null;
        }
      } else if (node === this._tail) {
        this._tail = node._prev;
        this._tail._next = null;
      }

      node._owner = null;
      return this;
    }
  }, {
    key: 'detachAll',
    value: function detachAll() {
      var node = this._head;
      if (!node) return this;

      this._head = this._tail = null;

      while (node) {
        node._owner = null;
        node = node._next;
      }
      return this;
    }
  }]);

  return MiniSignal;
})();

MiniSignal.MiniSignalBinding = MiniSignalBinding;

exports['default'] = MiniSignal;
module.exports = exports['default'];

},{}],7:[function(require,module,exports){
'use strict'

module.exports = function parseURI (str, opts) {
  opts = opts || {}

  var o = {
    key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
    q: {
      name: 'queryKey',
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
  }

  var m = o.parser[opts.strictMode ? 'strict' : 'loose'].exec(str)
  var uri = {}
  var i = 14

  while (i--) uri[o.key[i]] = m[i] || ''

  uri[o.q.name] = {}
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2
  })

  return uri
}

},{}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTG9hZGVyLmpzIiwibGliL1Jlc291cmNlLmpzIiwibGliL2FzeW5jLmpzIiwibGliL2I2NC5qcyIsImxpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9taW5pLXNpZ25hbHMvbGliL21pbmktc2lnbmFscy5qcyIsIm5vZGVfbW9kdWxlcy9wYXJzZS11cmkvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzb0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsb0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX21pbmlTaWduYWxzID0gcmVxdWlyZSgnbWluaS1zaWduYWxzJyk7XG5cbnZhciBfbWluaVNpZ25hbHMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbWluaVNpZ25hbHMpO1xuXG52YXIgX3BhcnNlVXJpID0gcmVxdWlyZSgncGFyc2UtdXJpJyk7XG5cbnZhciBfcGFyc2VVcmkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcGFyc2VVcmkpO1xuXG52YXIgX2FzeW5jID0gcmVxdWlyZSgnLi9hc3luYycpO1xuXG52YXIgYXN5bmMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfYXN5bmMpO1xuXG52YXIgX1Jlc291cmNlID0gcmVxdWlyZSgnLi9SZXNvdXJjZScpO1xuXG52YXIgX1Jlc291cmNlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1Jlc291cmNlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLy8gc29tZSBjb25zdGFudHNcbnZhciBNQVhfUFJPR1JFU1MgPSAxMDA7XG52YXIgcmd4RXh0cmFjdFVybEhhc2ggPSAvKCNbXFx3LV0rKT8kLztcblxuLyoqXG4gKiBNYW5hZ2VzIHRoZSBzdGF0ZSBhbmQgbG9hZGluZyBvZiBtdWx0aXBsZSByZXNvdXJjZXMgdG8gbG9hZC5cbiAqXG4gKiBAY2xhc3NcbiAqL1xuXG52YXIgTG9hZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbYmFzZVVybD0nJ10gLSBUaGUgYmFzZSB1cmwgZm9yIGFsbCByZXNvdXJjZXMgbG9hZGVkIGJ5IHRoaXMgbG9hZGVyLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uY3VycmVuY3k9MTBdIC0gVGhlIG51bWJlciBvZiByZXNvdXJjZXMgdG8gbG9hZCBjb25jdXJyZW50bHkuXG4gICAgICovXG4gICAgZnVuY3Rpb24gTG9hZGVyKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHZhciBiYXNlVXJsID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiAnJztcbiAgICAgICAgdmFyIGNvbmN1cnJlbmN5ID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAxMDtcblxuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTG9hZGVyKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGJhc2UgdXJsIGZvciBhbGwgcmVzb3VyY2VzIGxvYWRlZCBieSB0aGlzIGxvYWRlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5iYXNlVXJsID0gYmFzZVVybDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2dyZXNzIHBlcmNlbnQgb2YgdGhlIGxvYWRlciBnb2luZyB0aHJvdWdoIHRoZSBxdWV1ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvYWRpbmcgc3RhdGUgb2YgdGhlIGxvYWRlciwgdHJ1ZSBpZiBpdCBpcyBjdXJyZW50bHkgbG9hZGluZyByZXNvdXJjZXMuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge2Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSBxdWVyeXN0cmluZyB0byBhcHBlbmQgdG8gZXZlcnkgVVJMIGFkZGVkIHRvIHRoZSBsb2FkZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgc2hvdWxkIGJlIGEgdmFsaWQgcXVlcnkgc3RyaW5nICp3aXRob3V0KiB0aGUgcXVlc3Rpb24tbWFyayAoYD9gKS4gVGhlIGxvYWRlciB3aWxsXG4gICAgICAgICAqIGFsc28gKm5vdCogZXNjYXBlIHZhbHVlcyBmb3IgeW91LiBNYWtlIHN1cmUgdG8gZXNjYXBlIHlvdXIgcGFyYW1ldGVycyB3aXRoXG4gICAgICAgICAqIFtgZW5jb2RlVVJJQ29tcG9uZW50YF0oaHR0cHM6Ly9tZG4uaW8vZW5jb2RlVVJJQ29tcG9uZW50KSBiZWZvcmUgYXNzaWduaW5nIHRoaXMgcHJvcGVydHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIGNvbnN0IGxvYWRlciA9IG5ldyBMb2FkZXIoKTtcbiAgICAgICAgICpcbiAgICAgICAgICogbG9hZGVyLmRlZmF1bHRRdWVyeVN0cmluZyA9ICd1c2VyPW1lJnBhc3N3b3JkPXNlY3JldCc7XG4gICAgICAgICAqXG4gICAgICAgICAqIC8vIFRoaXMgd2lsbCByZXF1ZXN0ICdpbWFnZS5wbmc/dXNlcj1tZSZwYXNzd29yZD1zZWNyZXQnXG4gICAgICAgICAqIGxvYWRlci5hZGQoJ2ltYWdlLnBuZycpLmxvYWQoKTtcbiAgICAgICAgICpcbiAgICAgICAgICogbG9hZGVyLnJlc2V0KCk7XG4gICAgICAgICAqXG4gICAgICAgICAqIC8vIFRoaXMgd2lsbCByZXF1ZXN0ICdpbWFnZS5wbmc/dj0xJnVzZXI9bWUmcGFzc3dvcmQ9c2VjcmV0J1xuICAgICAgICAgKiBsb2FkZXIuYWRkKCdpYW1nZS5wbmc/dj0xJykubG9hZCgpO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZWZhdWx0UXVlcnlTdHJpbmcgPSAnJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1pZGRsZXdhcmUgdG8gcnVuIGJlZm9yZSBsb2FkaW5nIGVhY2ggcmVzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9uW119XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9iZWZvcmVNaWRkbGV3YXJlID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBtaWRkbGV3YXJlIHRvIHJ1biBhZnRlciBsb2FkaW5nIGVhY2ggcmVzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9uW119XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9hZnRlck1pZGRsZXdhcmUgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHRyYWNrcyB0aGUgcmVzb3VyY2VzIHdlIGFyZSBjdXJyZW50bHkgY29tcGxldGluZyBwYXJzaW5nIGZvci5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7UmVzb3VyY2VbXX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3Jlc291cmNlc1BhcnNpbmcgPSBbXTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGBfbG9hZFJlc291cmNlYCBmdW5jdGlvbiBib3VuZCB3aXRoIHRoaXMgb2JqZWN0IGNvbnRleHQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9ufVxuICAgICAgICAgKiBAcGFyYW0ge1Jlc291cmNlfSByIC0gVGhlIHJlc291cmNlIHRvIGxvYWRcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZCAtIFRoZSBkZXF1ZXVlIGZ1bmN0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2JvdW5kTG9hZFJlc291cmNlID0gZnVuY3Rpb24gKHIsIGQpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5fbG9hZFJlc291cmNlKHIsIGQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcmVzb3VyY2VzIHdhaXRpbmcgdG8gYmUgbG9hZGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAbWVtYmVyIHtSZXNvdXJjZVtdfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcXVldWUgPSBhc3luYy5xdWV1ZSh0aGlzLl9ib3VuZExvYWRSZXNvdXJjZSwgY29uY3VycmVuY3kpO1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnBhdXNlKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGlzIGxvYWRlciBrZXllZCBieSBuYW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtvYmplY3Q8c3RyaW5nLCBSZXNvdXJjZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlc291cmNlcyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaGVkIG9uY2UgcGVyIGxvYWRlZCBvciBlcnJvcmVkIHJlc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2FsbGJhY2sgbG9va3MgbGlrZSB7QGxpbmsgTG9hZGVyLk9uUHJvZ3Jlc3NTaWduYWx9LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtTaWduYWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uUHJvZ3Jlc3MgPSBuZXcgX21pbmlTaWduYWxzMi5kZWZhdWx0KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BhdGNoZWQgb25jZSBwZXIgZXJyb3JlZCByZXNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNhbGxiYWNrIGxvb2tzIGxpa2Uge0BsaW5rIExvYWRlci5PbkVycm9yU2lnbmFsfS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7U2lnbmFsfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vbkVycm9yID0gbmV3IF9taW5pU2lnbmFsczIuZGVmYXVsdCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaGVkIG9uY2UgcGVyIGxvYWRlZCByZXNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNhbGxiYWNrIGxvb2tzIGxpa2Uge0BsaW5rIExvYWRlci5PbkxvYWRTaWduYWx9LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtTaWduYWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uTG9hZCA9IG5ldyBfbWluaVNpZ25hbHMyLmRlZmF1bHQoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzcGF0Y2hlZCB3aGVuIHRoZSBsb2FkZXIgYmVnaW5zIHRvIHByb2Nlc3MgdGhlIHF1ZXVlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgY2FsbGJhY2sgbG9va3MgbGlrZSB7QGxpbmsgTG9hZGVyLk9uU3RhcnRTaWduYWx9LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtTaWduYWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uU3RhcnQgPSBuZXcgX21pbmlTaWduYWxzMi5kZWZhdWx0KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BhdGNoZWQgd2hlbiB0aGUgcXVldWVkIHJlc291cmNlcyBhbGwgbG9hZC5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNhbGxiYWNrIGxvb2tzIGxpa2Uge0BsaW5rIExvYWRlci5PbkNvbXBsZXRlU2lnbmFsfS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7U2lnbmFsfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlID0gbmV3IF9taW5pU2lnbmFsczIuZGVmYXVsdCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVuIHRoZSBwcm9ncmVzcyBjaGFuZ2VzIHRoZSBsb2FkZXIgYW5kIHJlc291cmNlIGFyZSBkaXNhcHRjaGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgTG9hZGVyXG4gICAgICAgICAqIEBjYWxsYmFjayBPblByb2dyZXNzU2lnbmFsXG4gICAgICAgICAqIEBwYXJhbSB7TG9hZGVyfSBsb2FkZXIgLSBUaGUgbG9hZGVyIHRoZSBwcm9ncmVzcyBpcyBhZHZhbmNpbmcgb24uXG4gICAgICAgICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIC0gVGhlIHJlc291cmNlIHRoYXQgaGFzIGNvbXBsZXRlZCBvciBmYWlsZWQgdG8gY2F1c2UgdGhlIHByb2dyZXNzIHRvIGFkdmFuY2UuXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVuIGFuIGVycm9yIG9jY3VycnMgdGhlIGxvYWRlciBhbmQgcmVzb3VyY2UgYXJlIGRpc2FwdGNoZWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBMb2FkZXJcbiAgICAgICAgICogQGNhbGxiYWNrIE9uRXJyb3JTaWduYWxcbiAgICAgICAgICogQHBhcmFtIHtMb2FkZXJ9IGxvYWRlciAtIFRoZSBsb2FkZXIgdGhlIGVycm9yIGhhcHBlbmVkIGluLlxuICAgICAgICAgKiBAcGFyYW0ge1Jlc291cmNlfSByZXNvdXJjZSAtIFRoZSByZXNvdXJjZSB0aGF0IGNhdXNlZCB0aGUgZXJyb3IuXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVuIGEgbG9hZCBjb21wbGV0ZXMgdGhlIGxvYWRlciBhbmQgcmVzb3VyY2UgYXJlIGRpc2FwdGNoZWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBMb2FkZXJcbiAgICAgICAgICogQGNhbGxiYWNrIE9uTG9hZFNpZ25hbFxuICAgICAgICAgKiBAcGFyYW0ge0xvYWRlcn0gbG9hZGVyIC0gVGhlIGxvYWRlciB0aGF0IGxhb2RlZCB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIC0gVGhlIHJlc291cmNlIHRoYXQgaGFzIGNvbXBsZXRlZCBsb2FkaW5nLlxuICAgICAgICAgKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hlbiB0aGUgbG9hZGVyIHN0YXJ0cyBsb2FkaW5nIHJlc291cmNlcyBpdCBkaXNwYXRjaGVzIHRoaXMgY2FsbGJhY2suXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXJvZiBMb2FkZXJcbiAgICAgICAgICogQGNhbGxiYWNrIE9uU3RhcnRTaWduYWxcbiAgICAgICAgICogQHBhcmFtIHtMb2FkZXJ9IGxvYWRlciAtIFRoZSBsb2FkZXIgdGhhdCBoYXMgc3RhcnRlZCBsb2FkaW5nIHJlc291cmNlcy5cbiAgICAgICAgICovXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZW4gdGhlIGxvYWRlciBjb21wbGV0ZXMgbG9hZGluZyByZXNvdXJjZXMgaXQgZGlzcGF0Y2hlcyB0aGlzIGNhbGxiYWNrLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgTG9hZGVyXG4gICAgICAgICAqIEBjYWxsYmFjayBPbkNvbXBsZXRlU2lnbmFsXG4gICAgICAgICAqIEBwYXJhbSB7TG9hZGVyfSBsb2FkZXIgLSBUaGUgbG9hZGVyIHRoYXQgaGFzIGZpbmlzaGVkIGxvYWRpbmcgcmVzb3VyY2VzLlxuICAgICAgICAgKi9cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgcmVzb3VyY2UgKG9yIG11bHRpcGxlIHJlc291cmNlcykgdG8gdGhlIGxvYWRlciBxdWV1ZS5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gY2FuIHRha2UgYSB3aWRlIHZhcmlldHkgb2YgZGlmZmVyZW50IHBhcmFtZXRlcnMuIFRoZSBvbmx5IHRoaW5nIHRoYXQgaXMgYWx3YXlzXG4gICAgICogcmVxdWlyZWQgdGhlIHVybCB0byBsb2FkLiBBbGwgdGhlIGZvbGxvd2luZyB3aWxsIHdvcms6XG4gICAgICpcbiAgICAgKiBgYGBqc1xuICAgICAqIGxvYWRlclxuICAgICAqICAgICAvLyBub3JtYWwgcGFyYW0gc3ludGF4XG4gICAgICogICAgIC5hZGQoJ2tleScsICdodHRwOi8vLi4uJywgZnVuY3Rpb24gKCkge30pXG4gICAgICogICAgIC5hZGQoJ2h0dHA6Ly8uLi4nLCBmdW5jdGlvbiAoKSB7fSlcbiAgICAgKiAgICAgLmFkZCgnaHR0cDovLy4uLicpXG4gICAgICpcbiAgICAgKiAgICAgLy8gb2JqZWN0IHN5bnRheFxuICAgICAqICAgICAuYWRkKHtcbiAgICAgKiAgICAgICAgIG5hbWU6ICdrZXkyJyxcbiAgICAgKiAgICAgICAgIHVybDogJ2h0dHA6Ly8uLi4nXG4gICAgICogICAgIH0sIGZ1bmN0aW9uICgpIHt9KVxuICAgICAqICAgICAuYWRkKHtcbiAgICAgKiAgICAgICAgIHVybDogJ2h0dHA6Ly8uLi4nXG4gICAgICogICAgIH0sIGZ1bmN0aW9uICgpIHt9KVxuICAgICAqICAgICAuYWRkKHtcbiAgICAgKiAgICAgICAgIG5hbWU6ICdrZXkzJyxcbiAgICAgKiAgICAgICAgIHVybDogJ2h0dHA6Ly8uLi4nXG4gICAgICogICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7fVxuICAgICAqICAgICB9KVxuICAgICAqICAgICAuYWRkKHtcbiAgICAgKiAgICAgICAgIHVybDogJ2h0dHBzOi8vLi4uJyxcbiAgICAgKiAgICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAqICAgICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICAgKiAgICAgfSlcbiAgICAgKlxuICAgICAqICAgICAvLyB5b3UgY2FuIGFsc28gcGFzcyBhbiBhcnJheSBvZiBvYmplY3RzIG9yIHVybHMgb3IgYm90aFxuICAgICAqICAgICAuYWRkKFtcbiAgICAgKiAgICAgICAgIHsgbmFtZTogJ2tleTQnLCB1cmw6ICdodHRwOi8vLi4uJywgb25Db21wbGV0ZTogZnVuY3Rpb24gKCkge30gfSxcbiAgICAgKiAgICAgICAgIHsgdXJsOiAnaHR0cDovLy4uLicsIG9uQ29tcGxldGU6IGZ1bmN0aW9uICgpIHt9IH0sXG4gICAgICogICAgICAgICAnaHR0cDovLy4uLidcbiAgICAgKiAgICAgXSlcbiAgICAgKlxuICAgICAqICAgICAvLyBhbmQgeW91IGNhbiB1c2UgYm90aCBwYXJhbXMgYW5kIG9wdGlvbnNcbiAgICAgKiAgICAgLmFkZCgna2V5JywgJ2h0dHA6Ly8uLi4nLCB7IGNyb3NzT3JpZ2luOiB0cnVlIH0sIGZ1bmN0aW9uICgpIHt9KVxuICAgICAqICAgICAuYWRkKCdodHRwOi8vLi4uJywgeyBjcm9zc09yaWdpbjogdHJ1ZSB9LCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWVdIC0gVGhlIG5hbWUgb2YgdGhlIHJlc291cmNlIHRvIGxvYWQsIGlmIG5vdCBwYXNzZWQgdGhlIHVybCBpcyB1c2VkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJsXSAtIFRoZSB1cmwgZm9yIHRoaXMgcmVzb3VyY2UsIHJlbGF0aXZlIHRvIHRoZSBiYXNlVXJsIG9mIHRoaXMgbG9hZGVyLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gLSBUaGUgb3B0aW9ucyBmb3IgdGhlIGxvYWQuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jcm9zc09yaWdpbl0gLSBJcyB0aGlzIHJlcXVlc3QgY3Jvc3Mtb3JpZ2luPyBEZWZhdWx0IGlzIHRvIGRldGVybWluZSBhdXRvbWF0aWNhbGx5LlxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2UuTE9BRF9UWVBFfSBbb3B0aW9ucy5sb2FkVHlwZT1SZXNvdXJjZS5MT0FEX1RZUEUuWEhSXSAtIEhvdyBzaG91bGQgdGhpcyByZXNvdXJjZSBiZSBsb2FkZWQ/XG4gICAgICogQHBhcmFtIHtSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRX0gW29wdGlvbnMueGhyVHlwZT1SZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ERUZBVUxUXSAtIEhvdyBzaG91bGRcbiAgICAgKiAgICAgIHRoZSBkYXRhIGJlaW5nIGxvYWRlZCBiZSBpbnRlcnByZXRlZCB3aGVuIHVzaW5nIFhIUj9cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMubWV0YWRhdGFdIC0gRXh0cmEgY29uZmlndXJhdGlvbiBmb3IgbWlkZGxld2FyZSBhbmQgdGhlIFJlc291cmNlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR8SFRNTEF1ZGlvRWxlbWVudHxIVE1MVmlkZW9FbGVtZW50fSBbb3B0aW9ucy5tZXRhZGF0YS5sb2FkRWxlbWVudD1udWxsXSAtIFRoZVxuICAgICAqICAgICAgZWxlbWVudCB0byB1c2UgZm9yIGxvYWRpbmcsIGluc3RlYWQgb2YgY3JlYXRpbmcgb25lLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubWV0YWRhdGEuc2tpcFNvdXJjZT1mYWxzZV0gLSBTa2lwcyBhZGRpbmcgc291cmNlKHMpIHRvIHRoZSBsb2FkIGVsZW1lbnQuIFRoaXNcbiAgICAgKiAgICAgIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBwYXNzIGluIGEgYGxvYWRFbGVtZW50YCB0aGF0IHlvdSBhbHJlYWR5IGFkZGVkIGxvYWQgc291cmNlcyB0by5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2JdIC0gRnVuY3Rpb24gdG8gY2FsbCB3aGVuIHRoaXMgc3BlY2lmaWMgcmVzb3VyY2UgY29tcGxldGVzIGxvYWRpbmcuXG4gICAgICogQHJldHVybiB7TG9hZGVyfSBSZXR1cm5zIGl0c2VsZi5cbiAgICAgKi9cblxuXG4gICAgTG9hZGVyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQobmFtZSwgdXJsLCBvcHRpb25zLCBjYikge1xuICAgICAgICAvLyBzcGVjaWFsIGNhc2Ugb2YgYW4gYXJyYXkgb2Ygb2JqZWN0cyBvciB1cmxzXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5hbWUpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZChuYW1lW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBhbiBvYmplY3QgaXMgcGFzc2VkIGluc3RlYWQgb2YgcGFyYW1zXG4gICAgICAgIGlmICgodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnID8gJ3VuZGVmaW5lZCcgOiBfdHlwZW9mKG5hbWUpKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNiID0gdXJsIHx8IG5hbWUuY2FsbGJhY2sgfHwgbmFtZS5vbkNvbXBsZXRlO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG5hbWU7XG4gICAgICAgICAgICB1cmwgPSBuYW1lLnVybDtcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLm5hbWUgfHwgbmFtZS5rZXkgfHwgbmFtZS51cmw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjYXNlIHdoZXJlIG5vIG5hbWUgaXMgcGFzc2VkIHNoaWZ0IGFsbCBhcmdzIG92ZXIgYnkgb25lLlxuICAgICAgICBpZiAodHlwZW9mIHVybCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNiID0gb3B0aW9ucztcbiAgICAgICAgICAgIG9wdGlvbnMgPSB1cmw7XG4gICAgICAgICAgICB1cmwgPSBuYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm93IHRoYXQgd2Ugc2hpZnRlZCBtYWtlIHN1cmUgd2UgaGF2ZSBhIHByb3BlciB1cmwuXG4gICAgICAgIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB1cmwgcGFzc2VkIHRvIGFkZCByZXNvdXJjZSB0byBsb2FkZXIuJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBvcHRpb25zIGFyZSBvcHRpb25hbCBzbyBwZW9wbGUgbWlnaHQgcGFzcyBhIGZ1bmN0aW9uIGFuZCBubyBvcHRpb25zXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IgPSBvcHRpb25zO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBsb2FkaW5nIGFscmVhZHkgeW91IGNhbiBvbmx5IGFkZCByZXNvdXJjZXMgdGhhdCBoYXZlIGEgcGFyZW50LlxuICAgICAgICBpZiAodGhpcy5sb2FkaW5nICYmICghb3B0aW9ucyB8fCAhb3B0aW9ucy5wYXJlbnRSZXNvdXJjZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGFkZCByZXNvdXJjZXMgd2hpbGUgdGhlIGxvYWRlciBpcyBydW5uaW5nLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgcmVzb3VyY2UgYWxyZWFkeSBleGlzdHMuXG4gICAgICAgIGlmICh0aGlzLnJlc291cmNlc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZXNvdXJjZSBuYW1lZCBcIicgKyBuYW1lICsgJ1wiIGFscmVhZHkgZXhpc3RzLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYWRkIGJhc2UgdXJsIGlmIHRoaXMgaXNuJ3QgYW4gYWJzb2x1dGUgdXJsXG4gICAgICAgIHVybCA9IHRoaXMuX3ByZXBhcmVVcmwodXJsKTtcblxuICAgICAgICAvLyBjcmVhdGUgdGhlIHN0b3JlIHRoZSByZXNvdXJjZVxuICAgICAgICB0aGlzLnJlc291cmNlc1tuYW1lXSA9IG5ldyBfUmVzb3VyY2UyLmRlZmF1bHQobmFtZSwgdXJsLCBvcHRpb25zKTtcblxuICAgICAgICBpZiAodHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLnJlc291cmNlc1tuYW1lXS5vbkFmdGVyTWlkZGxld2FyZS5vbmNlKGNiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIGFjdGl2ZWx5IGxvYWRpbmcsIG1ha2Ugc3VyZSB0byBhZGp1c3QgcHJvZ3Jlc3MgY2h1bmtzIGZvciB0aGF0IHBhcmVudCBhbmQgaXRzIGNoaWxkcmVuXG4gICAgICAgIGlmICh0aGlzLmxvYWRpbmcpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBvcHRpb25zLnBhcmVudFJlc291cmNlO1xuICAgICAgICAgICAgdmFyIGluY29tcGxldGVDaGlsZHJlbiA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgcGFyZW50LmNoaWxkcmVuLmxlbmd0aDsgKytfaSkge1xuICAgICAgICAgICAgICAgIGlmICghcGFyZW50LmNoaWxkcmVuW19pXS5pc0NvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGluY29tcGxldGVDaGlsZHJlbi5wdXNoKHBhcmVudC5jaGlsZHJlbltfaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZ1bGxDaHVuayA9IHBhcmVudC5wcm9ncmVzc0NodW5rICogKGluY29tcGxldGVDaGlsZHJlbi5sZW5ndGggKyAxKTsgLy8gKzEgZm9yIHBhcmVudFxuICAgICAgICAgICAgdmFyIGVhY2hDaHVuayA9IGZ1bGxDaHVuayAvIChpbmNvbXBsZXRlQ2hpbGRyZW4ubGVuZ3RoICsgMik7IC8vICsyIGZvciBwYXJlbnQgJiBuZXcgY2hpbGRcblxuICAgICAgICAgICAgcGFyZW50LmNoaWxkcmVuLnB1c2godGhpcy5yZXNvdXJjZXNbbmFtZV0pO1xuICAgICAgICAgICAgcGFyZW50LnByb2dyZXNzQ2h1bmsgPSBlYWNoQ2h1bms7XG5cbiAgICAgICAgICAgIGZvciAodmFyIF9pMiA9IDA7IF9pMiA8IGluY29tcGxldGVDaGlsZHJlbi5sZW5ndGg7ICsrX2kyKSB7XG4gICAgICAgICAgICAgICAgaW5jb21wbGV0ZUNoaWxkcmVuW19pMl0ucHJvZ3Jlc3NDaHVuayA9IGVhY2hDaHVuaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZXNvdXJjZXNbbmFtZV0ucHJvZ3Jlc3NDaHVuayA9IGVhY2hDaHVuaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCB0aGUgcmVzb3VyY2UgdG8gdGhlIHF1ZXVlXG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2godGhpcy5yZXNvdXJjZXNbbmFtZV0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIGEgbWlkZGxld2FyZSBmdW5jdGlvbiB0aGF0IHdpbGwgcnVuICpiZWZvcmUqIHRoZVxuICAgICAqIHJlc291cmNlIGlzIGxvYWRlZC5cbiAgICAgKlxuICAgICAqIEBtZXRob2QgYmVmb3JlXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZm4gLSBUaGUgbWlkZGxld2FyZSBmdW5jdGlvbiB0byByZWdpc3Rlci5cbiAgICAgKiBAcmV0dXJuIHtMb2FkZXJ9IFJldHVybnMgaXRzZWxmLlxuICAgICAqL1xuXG5cbiAgICBMb2FkZXIucHJvdG90eXBlLnByZSA9IGZ1bmN0aW9uIHByZShmbikge1xuICAgICAgICB0aGlzLl9iZWZvcmVNaWRkbGV3YXJlLnB1c2goZm4pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIGEgbWlkZGxld2FyZSBmdW5jdGlvbiB0aGF0IHdpbGwgcnVuICphZnRlciogdGhlXG4gICAgICogcmVzb3VyY2UgaXMgbG9hZGVkLlxuICAgICAqXG4gICAgICogQGFsaWFzIHVzZVxuICAgICAqIEBtZXRob2QgYWZ0ZXJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmbiAtIFRoZSBtaWRkbGV3YXJlIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyLlxuICAgICAqIEByZXR1cm4ge0xvYWRlcn0gUmV0dXJucyBpdHNlbGYuXG4gICAgICovXG5cblxuICAgIExvYWRlci5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24gdXNlKGZuKSB7XG4gICAgICAgIHRoaXMuX2FmdGVyTWlkZGxld2FyZS5wdXNoKGZuKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBxdWV1ZSBvZiB0aGUgbG9hZGVyIHRvIHByZXBhcmUgZm9yIGEgbmV3IGxvYWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtMb2FkZXJ9IFJldHVybnMgaXRzZWxmLlxuICAgICAqL1xuXG5cbiAgICBMb2FkZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5raWxsKCk7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnBhdXNlKCk7XG5cbiAgICAgICAgLy8gYWJvcnQgYWxsIHJlc291cmNlIGxvYWRzXG4gICAgICAgIGZvciAodmFyIGsgaW4gdGhpcy5yZXNvdXJjZXMpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSB0aGlzLnJlc291cmNlc1trXTtcblxuICAgICAgICAgICAgaWYgKHJlcy5fb25Mb2FkQmluZGluZykge1xuICAgICAgICAgICAgICAgIHJlcy5fb25Mb2FkQmluZGluZy5kZXRhY2goKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcy5pc0xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICByZXMuYWJvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVzb3VyY2VzID0ge307XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBsb2FkaW5nIHRoZSBxdWV1ZWQgcmVzb3VyY2VzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NiXSAtIE9wdGlvbmFsIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBib3VuZCB0byB0aGUgYGNvbXBsZXRlYCBldmVudC5cbiAgICAgKiBAcmV0dXJuIHtMb2FkZXJ9IFJldHVybnMgaXRzZWxmLlxuICAgICAqL1xuXG5cbiAgICBMb2FkZXIucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiBsb2FkKGNiKSB7XG4gICAgICAgIC8vIHJlZ2lzdGVyIGNvbXBsZXRlIGNhbGxiYWNrIGlmIHRoZXkgcGFzcyBvbmVcbiAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy5vbkNvbXBsZXRlLm9uY2UoY2IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIHF1ZXVlIGhhcyBhbHJlYWR5IHN0YXJ0ZWQgd2UgYXJlIGRvbmUgaGVyZVxuICAgICAgICBpZiAodGhpcy5sb2FkaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9xdWV1ZS5pZGxlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX29uU3RhcnQoKTtcbiAgICAgICAgICAgIHRoaXMuX29uQ29tcGxldGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGRpc3RyaWJ1dGUgcHJvZ3Jlc3MgY2h1bmtzXG4gICAgICAgICAgICB2YXIgbnVtVGFza3MgPSB0aGlzLl9xdWV1ZS5fdGFza3MubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGNodW5rID0gMTAwIC8gbnVtVGFza3M7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fcXVldWUuX3Rhc2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcXVldWUuX3Rhc2tzW2ldLmRhdGEucHJvZ3Jlc3NDaHVuayA9IGNodW5rO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBub3RpZnkgd2UgYXJlIHN0YXJ0aW5nXG4gICAgICAgICAgICB0aGlzLl9vblN0YXJ0KCk7XG5cbiAgICAgICAgICAgIC8vIHN0YXJ0IGxvYWRpbmdcbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnJlc3VtZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2YgcmVzb3VyY2VzIHRvIGxvYWQgY29uY3VycmVudGx5LlxuICAgICAqXG4gICAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgICAqIEBkZWZhdWx0IDEwXG4gICAgICovXG5cblxuICAgIC8qKlxuICAgICAqIFByZXBhcmVzIGEgdXJsIGZvciB1c2FnZSBiYXNlZCBvbiB0aGUgY29uZmlndXJhdGlvbiBvZiB0aGlzIG9iamVjdFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVGhlIHVybCB0byBwcmVwYXJlLlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIHByZXBhcmVkIHVybC5cbiAgICAgKi9cbiAgICBMb2FkZXIucHJvdG90eXBlLl9wcmVwYXJlVXJsID0gZnVuY3Rpb24gX3ByZXBhcmVVcmwodXJsKSB7XG4gICAgICAgIHZhciBwYXJzZWRVcmwgPSAoMCwgX3BhcnNlVXJpMi5kZWZhdWx0KSh1cmwsIHsgc3RyaWN0TW9kZTogdHJ1ZSB9KTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHZvaWQgMDtcblxuICAgICAgICAvLyBhYnNvbHV0ZSB1cmwsIGp1c3QgdXNlIGl0IGFzIGlzLlxuICAgICAgICBpZiAocGFyc2VkVXJsLnByb3RvY29sIHx8ICFwYXJzZWRVcmwucGF0aCB8fCB1cmwuaW5kZXhPZignLy8nKSA9PT0gMCkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdXJsO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIGJhc2VVcmwgZG9lc24ndCBlbmQgaW4gc2xhc2ggYW5kIHVybCBkb2Vzbid0IHN0YXJ0IHdpdGggc2xhc2gsIHRoZW4gYWRkIGEgc2xhc2ggaW5iZXR3ZWVuXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuYmFzZVVybC5sZW5ndGggJiYgdGhpcy5iYXNlVXJsLmxhc3RJbmRleE9mKCcvJykgIT09IHRoaXMuYmFzZVVybC5sZW5ndGggLSAxICYmIHVybC5jaGFyQXQoMCkgIT09ICcvJykge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuYmFzZVVybCArICcvJyArIHVybDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5iYXNlVXJsICsgdXJsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHdlIG5lZWQgdG8gYWRkIGEgZGVmYXVsdCBxdWVyeXN0cmluZywgdGhlcmUgaXMgYSBiaXQgbW9yZSB3b3JrXG4gICAgICAgIGlmICh0aGlzLmRlZmF1bHRRdWVyeVN0cmluZykge1xuICAgICAgICAgICAgdmFyIGhhc2ggPSByZ3hFeHRyYWN0VXJsSGFzaC5leGVjKHJlc3VsdClbMF07XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5zdWJzdHIoMCwgcmVzdWx0Lmxlbmd0aCAtIGhhc2gubGVuZ3RoKTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5pbmRleE9mKCc/JykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcmJyArIHRoaXMuZGVmYXVsdFF1ZXJ5U3RyaW5nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJz8nICsgdGhpcy5kZWZhdWx0UXVlcnlTdHJpbmc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc3VsdCArPSBoYXNoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTG9hZHMgYSBzaW5nbGUgcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIC0gVGhlIHJlc291cmNlIHRvIGxvYWQuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZGVxdWV1ZSAtIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gd2UgbmVlZCB0byBkZXF1ZXVlIHRoaXMgaXRlbS5cbiAgICAgKi9cblxuXG4gICAgTG9hZGVyLnByb3RvdHlwZS5fbG9hZFJlc291cmNlID0gZnVuY3Rpb24gX2xvYWRSZXNvdXJjZShyZXNvdXJjZSwgZGVxdWV1ZSkge1xuICAgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgICByZXNvdXJjZS5fZGVxdWV1ZSA9IGRlcXVldWU7XG5cbiAgICAgICAgLy8gcnVuIGJlZm9yZSBtaWRkbGV3YXJlXG4gICAgICAgIGFzeW5jLmVhY2hTZXJpZXModGhpcy5fYmVmb3JlTWlkZGxld2FyZSwgZnVuY3Rpb24gKGZuLCBuZXh0KSB7XG4gICAgICAgICAgICBmbi5jYWxsKF90aGlzMiwgcmVzb3VyY2UsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgYmVmb3JlIG1pZGRsZXdhcmUgbWFya3MgdGhlIHJlc291cmNlIGFzIGNvbXBsZXRlLFxuICAgICAgICAgICAgICAgIC8vIGJyZWFrIGFuZCBkb24ndCBwcm9jZXNzIGFueSBtb3JlIGJlZm9yZSBtaWRkbGV3YXJlXG4gICAgICAgICAgICAgICAgbmV4dChyZXNvdXJjZS5pc0NvbXBsZXRlID8ge30gOiBudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAocmVzb3VyY2UuaXNDb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIF90aGlzMi5fb25Mb2FkKHJlc291cmNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UuX29uTG9hZEJpbmRpbmcgPSByZXNvdXJjZS5vbkNvbXBsZXRlLm9uY2UoX3RoaXMyLl9vbkxvYWQsIF90aGlzMik7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UubG9hZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIG9uY2UgbG9hZGluZyBoYXMgc3RhcnRlZC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG5cblxuICAgIExvYWRlci5wcm90b3R5cGUuX29uU3RhcnQgPSBmdW5jdGlvbiBfb25TdGFydCgpIHtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgICAgIHRoaXMubG9hZGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMub25TdGFydC5kaXNwYXRjaCh0aGlzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIG9uY2UgZWFjaCByZXNvdXJjZSBoYXMgbG9hZGVkLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cblxuXG4gICAgTG9hZGVyLnByb3RvdHlwZS5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uIF9vbkNvbXBsZXRlKCkge1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gTUFYX1BST0dSRVNTO1xuICAgICAgICB0aGlzLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbkNvbXBsZXRlLmRpc3BhdGNoKHRoaXMsIHRoaXMucmVzb3VyY2VzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGVhY2ggdGltZSBhIHJlc291cmNlcyBpcyBsb2FkZWQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIC0gVGhlIHJlc291cmNlIHRoYXQgd2FzIGxvYWRlZFxuICAgICAqL1xuXG5cbiAgICBMb2FkZXIucHJvdG90eXBlLl9vbkxvYWQgPSBmdW5jdGlvbiBfb25Mb2FkKHJlc291cmNlKSB7XG4gICAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICAgIHJlc291cmNlLl9vbkxvYWRCaW5kaW5nID0gbnVsbDtcblxuICAgICAgICAvLyByZW1vdmUgdGhpcyByZXNvdXJjZSBmcm9tIHRoZSBhc3luYyBxdWV1ZSwgYW5kIGFkZCBpdCB0byBvdXIgbGlzdCBvZiByZXNvdXJjZXMgdGhhdCBhcmUgYmVpbmcgcGFyc2VkXG4gICAgICAgIHRoaXMuX3Jlc291cmNlc1BhcnNpbmcucHVzaChyZXNvdXJjZSk7XG4gICAgICAgIHJlc291cmNlLl9kZXF1ZXVlKCk7XG5cbiAgICAgICAgLy8gcnVuIGFsbCB0aGUgYWZ0ZXIgbWlkZGxld2FyZSBmb3IgdGhpcyByZXNvdXJjZVxuICAgICAgICBhc3luYy5lYWNoU2VyaWVzKHRoaXMuX2FmdGVyTWlkZGxld2FyZSwgZnVuY3Rpb24gKGZuLCBuZXh0KSB7XG4gICAgICAgICAgICBmbi5jYWxsKF90aGlzMywgcmVzb3VyY2UsIG5leHQpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXNvdXJjZS5vbkFmdGVyTWlkZGxld2FyZS5kaXNwYXRjaChyZXNvdXJjZSk7XG5cbiAgICAgICAgICAgIF90aGlzMy5wcm9ncmVzcyArPSByZXNvdXJjZS5wcm9ncmVzc0NodW5rO1xuICAgICAgICAgICAgX3RoaXMzLm9uUHJvZ3Jlc3MuZGlzcGF0Y2goX3RoaXMzLCByZXNvdXJjZSk7XG5cbiAgICAgICAgICAgIGlmIChyZXNvdXJjZS5lcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzMy5vbkVycm9yLmRpc3BhdGNoKHJlc291cmNlLmVycm9yLCBfdGhpczMsIHJlc291cmNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgX3RoaXMzLm9uTG9hZC5kaXNwYXRjaChfdGhpczMsIHJlc291cmNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXMzLl9yZXNvdXJjZXNQYXJzaW5nLnNwbGljZShfdGhpczMuX3Jlc291cmNlc1BhcnNpbmcuaW5kZXhPZihyZXNvdXJjZSksIDEpO1xuXG4gICAgICAgICAgICAvLyBkbyBjb21wbGV0aW9uIGNoZWNrXG4gICAgICAgICAgICBpZiAoX3RoaXMzLl9xdWV1ZS5pZGxlKCkgJiYgX3RoaXMzLl9yZXNvdXJjZXNQYXJzaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIF90aGlzMy5fb25Db21wbGV0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcbiAgICB9O1xuXG4gICAgX2NyZWF0ZUNsYXNzKExvYWRlciwgW3tcbiAgICAgICAga2V5OiAnY29uY3VycmVuY3knLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9xdWV1ZS5jb25jdXJyZW5jeTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVxdWlyZS1qc2RvY1xuICAgICAgICAsXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KGNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5jb25jdXJyZW5jeSA9IGNvbmN1cnJlbmN5O1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIExvYWRlcjtcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gTG9hZGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TG9hZGVyLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxudmFyIF9wYXJzZVVyaSA9IHJlcXVpcmUoJ3BhcnNlLXVyaScpO1xuXG52YXIgX3BhcnNlVXJpMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3BhcnNlVXJpKTtcblxudmFyIF9taW5pU2lnbmFscyA9IHJlcXVpcmUoJ21pbmktc2lnbmFscycpO1xuXG52YXIgX21pbmlTaWduYWxzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX21pbmlTaWduYWxzKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLy8gdGVzdHMgaXMgQ09SUyBpcyBzdXBwb3J0ZWQgaW4gWEhSLCBpZiBub3Qgd2UgbmVlZCB0byB1c2UgWERSXG52YXIgdXNlWGRyID0gISEod2luZG93LlhEb21haW5SZXF1ZXN0ICYmICEoJ3dpdGhDcmVkZW50aWFscycgaW4gbmV3IFhNTEh0dHBSZXF1ZXN0KCkpKTtcbnZhciB0ZW1wQW5jaG9yID0gbnVsbDtcblxuLy8gc29tZSBzdGF0dXMgY29uc3RhbnRzXG52YXIgU1RBVFVTX05PTkUgPSAwO1xudmFyIFNUQVRVU19PSyA9IDIwMDtcbnZhciBTVEFUVVNfRU1QVFkgPSAyMDQ7XG52YXIgU1RBVFVTX0lFX0JVR19FTVBUWSA9IDEyMjM7XG52YXIgU1RBVFVTX1RZUEVfT0sgPSAyO1xuXG4vLyBub29wXG5mdW5jdGlvbiBfbm9vcCgpIHt9IC8qIGVtcHR5ICovXG5cbi8qKlxuICogTWFuYWdlcyB0aGUgc3RhdGUgYW5kIGxvYWRpbmcgb2YgYSByZXNvdXJjZSBhbmQgYWxsIGNoaWxkIHJlc291cmNlcy5cbiAqXG4gKiBAY2xhc3NcbiAqL1xuXG52YXIgUmVzb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgbG9hZCB0eXBlIHRvIGJlIHVzZWQgZm9yIGEgc3BlY2lmaWMgZXh0ZW5zaW9uLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBleHRuYW1lIC0gVGhlIGV4dGVuc2lvbiB0byBzZXQgdGhlIHR5cGUgZm9yLCBlLmcuIFwicG5nXCIgb3IgXCJmbnRcIlxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2UuTE9BRF9UWVBFfSBsb2FkVHlwZSAtIFRoZSBsb2FkIHR5cGUgdG8gc2V0IGl0IHRvLlxuICAgICAqL1xuICAgIFJlc291cmNlLnNldEV4dGVuc2lvbkxvYWRUeXBlID0gZnVuY3Rpb24gc2V0RXh0ZW5zaW9uTG9hZFR5cGUoZXh0bmFtZSwgbG9hZFR5cGUpIHtcbiAgICAgICAgc2V0RXh0TWFwKFJlc291cmNlLl9sb2FkVHlwZU1hcCwgZXh0bmFtZSwgbG9hZFR5cGUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBsb2FkIHR5cGUgdG8gYmUgdXNlZCBmb3IgYSBzcGVjaWZpYyBleHRlbnNpb24uXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV4dG5hbWUgLSBUaGUgZXh0ZW5zaW9uIHRvIHNldCB0aGUgdHlwZSBmb3IsIGUuZy4gXCJwbmdcIiBvciBcImZudFwiXG4gICAgICogQHBhcmFtIHtSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRX0geGhyVHlwZSAtIFRoZSB4aHIgdHlwZSB0byBzZXQgaXQgdG8uXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnNldEV4dGVuc2lvblhoclR5cGUgPSBmdW5jdGlvbiBzZXRFeHRlbnNpb25YaHJUeXBlKGV4dG5hbWUsIHhoclR5cGUpIHtcbiAgICAgICAgc2V0RXh0TWFwKFJlc291cmNlLl94aHJUeXBlTWFwLCBleHRuYW1lLCB4aHJUeXBlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgcmVzb3VyY2UgdG8gbG9hZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gdXJsIC0gVGhlIHVybCBmb3IgdGhpcyByZXNvdXJjZSwgZm9yIGF1ZGlvL3ZpZGVvIGxvYWRzIHlvdSBjYW4gcGFzc1xuICAgICAqICAgICAgYW4gYXJyYXkgb2Ygc291cmNlcy5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIC0gVGhlIG9wdGlvbnMgZm9yIHRoZSBsb2FkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfGJvb2xlYW59IFtvcHRpb25zLmNyb3NzT3JpZ2luXSAtIElzIHRoaXMgcmVxdWVzdCBjcm9zcy1vcmlnaW4/IERlZmF1bHQgaXMgdG9cbiAgICAgKiAgICAgIGRldGVybWluZSBhdXRvbWF0aWNhbGx5LlxuICAgICAqIEBwYXJhbSB7UmVzb3VyY2UuTE9BRF9UWVBFfSBbb3B0aW9ucy5sb2FkVHlwZT1SZXNvdXJjZS5MT0FEX1RZUEUuWEhSXSAtIEhvdyBzaG91bGQgdGhpcyByZXNvdXJjZVxuICAgICAqICAgICAgYmUgbG9hZGVkP1xuICAgICAqIEBwYXJhbSB7UmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEV9IFtvcHRpb25zLnhoclR5cGU9UmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuREVGQVVMVF0gLSBIb3dcbiAgICAgKiAgICAgIHNob3VsZCB0aGUgZGF0YSBiZWluZyBsb2FkZWQgYmUgaW50ZXJwcmV0ZWQgd2hlbiB1c2luZyBYSFI/XG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zLm1ldGFkYXRhXSAtIEV4dHJhIGNvbmZpZ3VyYXRpb24gZm9yIG1pZGRsZXdhcmUgYW5kIHRoZSBSZXNvdXJjZSBvYmplY3QuXG4gICAgICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fEhUTUxBdWRpb0VsZW1lbnR8SFRNTFZpZGVvRWxlbWVudH0gW29wdGlvbnMubWV0YWRhdGEubG9hZEVsZW1lbnQ9bnVsbF0gLSBUaGVcbiAgICAgKiAgICAgIGVsZW1lbnQgdG8gdXNlIGZvciBsb2FkaW5nLCBpbnN0ZWFkIG9mIGNyZWF0aW5nIG9uZS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm1ldGFkYXRhLnNraXBTb3VyY2U9ZmFsc2VdIC0gU2tpcHMgYWRkaW5nIHNvdXJjZShzKSB0byB0aGUgbG9hZCBlbGVtZW50LiBUaGlzXG4gICAgICogICAgICBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gcGFzcyBpbiBhIGBsb2FkRWxlbWVudGAgdGhhdCB5b3UgYWxyZWFkeSBhZGRlZCBsb2FkIHNvdXJjZXMgdG8uXG4gICAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IFtvcHRpb25zLm1ldGFkYXRhLm1pbWVUeXBlXSAtIFRoZSBtaW1lIHR5cGUgdG8gdXNlIGZvciB0aGUgc291cmNlIGVsZW1lbnQgb2YgYSB2aWRlby9hdWRpb1xuICAgICAqICAgICAgZWxtZW50LiBJZiB0aGUgdXJscyBhcmUgYW4gYXJyYXksIHlvdSBjYW4gcGFzcyB0aGlzIGFzIGFuIGFycmF5IGFzIHdlbGwgd2hlcmUgZWFjaCBpbmRleCBpcyB0aGUgbWltZSB0eXBlIHRvXG4gICAgICogICAgICB1c2UgZm9yIHRoZSBjb3JyZXNwb25kaW5nIHVybCBpbmRleC5cbiAgICAgKi9cblxuXG4gICAgZnVuY3Rpb24gUmVzb3VyY2UobmFtZSwgdXJsLCBvcHRpb25zKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBSZXNvdXJjZSk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgdXJsICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCb3RoIG5hbWUgYW5kIHVybCBhcmUgcmVxdWlyZWQgZm9yIGNvbnN0cnVjdGluZyBhIHJlc291cmNlLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBzdGF0ZSBmbGFncyBvZiB0aGlzIHJlc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9mbGFncyA9IDA7XG5cbiAgICAgICAgLy8gc2V0IGRhdGEgdXJsIGZsYWcsIG5lZWRzIHRvIGJlIHNldCBlYXJseSBmb3Igc29tZSBfZGV0ZXJtaW5lWCBjaGVja3MgdG8gd29yay5cbiAgICAgICAgdGhpcy5fc2V0RmxhZyhSZXNvdXJjZS5TVEFUVVNfRkxBR1MuREFUQV9VUkwsIHVybC5pbmRleE9mKCdkYXRhOicpID09PSAwKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG5hbWUgb2YgdGhpcyByZXNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7c3RyaW5nfVxuICAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB1cmwgdXNlZCB0byBsb2FkIHRoaXMgcmVzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge3N0cmluZ31cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGV4dGVuc2lvbiB1c2VkIHRvIGxvYWQgdGhpcyByZXNvdXJjZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7c3RyaW5nfVxuICAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZXh0ZW5zaW9uID0gdGhpcy5fZ2V0RXh0ZW5zaW9uKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBkYXRhIHRoYXQgd2FzIGxvYWRlZCBieSB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge2FueX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZGF0YSA9IG51bGw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElzIHRoaXMgcmVxdWVzdCBjcm9zcy1vcmlnaW4/IElmIHVuc2V0LCBkZXRlcm1pbmVkIGF1dG9tYXRpY2FsbHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY3Jvc3NPcmlnaW4gPSBvcHRpb25zLmNyb3NzT3JpZ2luID09PSB0cnVlID8gJ2Fub255bW91cycgOiBvcHRpb25zLmNyb3NzT3JpZ2luO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbWV0aG9kIG9mIGxvYWRpbmcgdG8gdXNlIGZvciB0aGlzIHJlc291cmNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtSZXNvdXJjZS5MT0FEX1RZUEV9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxvYWRUeXBlID0gb3B0aW9ucy5sb2FkVHlwZSB8fCB0aGlzLl9kZXRlcm1pbmVMb2FkVHlwZSgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdHlwZSB1c2VkIHRvIGxvYWQgdGhlIHJlc291cmNlIHZpYSBYSFIuIElmIHVuc2V0LCBkZXRlcm1pbmVkIGF1dG9tYXRpY2FsbHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMueGhyVHlwZSA9IG9wdGlvbnMueGhyVHlwZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRXh0cmEgaW5mbyBmb3IgbWlkZGxld2FyZSwgYW5kIGNvbnRyb2xsaW5nIHNwZWNpZmljcyBhYm91dCBob3cgdGhlIHJlc291cmNlIGxvYWRzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlIHRoYXQgaWYgeW91IHBhc3MgaW4gYSBgbG9hZEVsZW1lbnRgLCB0aGUgUmVzb3VyY2UgY2xhc3MgdGFrZXMgb3duZXJzaGlwIG9mIGl0LlxuICAgICAgICAgKiBNZWFuaW5nIGl0IHdpbGwgbW9kaWZ5IGl0IGFzIGl0IHNlZXMgZml0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtvYmplY3R9XG4gICAgICAgICAqIEBwcm9wZXJ0eSB7SFRNTEltYWdlRWxlbWVudHxIVE1MQXVkaW9FbGVtZW50fEhUTUxWaWRlb0VsZW1lbnR9IFtsb2FkRWxlbWVudD1udWxsXSAtIFRoZVxuICAgICAgICAgKiAgZWxlbWVudCB0byB1c2UgZm9yIGxvYWRpbmcsIGluc3RlYWQgb2YgY3JlYXRpbmcgb25lLlxuICAgICAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IFtza2lwU291cmNlPWZhbHNlXSAtIFNraXBzIGFkZGluZyBzb3VyY2UocykgdG8gdGhlIGxvYWQgZWxlbWVudC4gVGhpc1xuICAgICAgICAgKiAgaXMgdXNlZnVsIGlmIHlvdSB3YW50IHRvIHBhc3MgaW4gYSBgbG9hZEVsZW1lbnRgIHRoYXQgeW91IGFscmVhZHkgYWRkZWQgbG9hZCBzb3VyY2VzXG4gICAgICAgICAqICB0by5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubWV0YWRhdGEgPSBvcHRpb25zLm1ldGFkYXRhIHx8IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZXJyb3IgdGhhdCBvY2N1cnJlZCB3aGlsZSBsb2FkaW5nIChpZiBhbnkpLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtFcnJvcn1cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmVycm9yID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIFhIUiBvYmplY3QgdGhhdCB3YXMgdXNlZCB0byBsb2FkIHRoaXMgcmVzb3VyY2UuIFRoaXMgaXMgb25seSBzZXRcbiAgICAgICAgICogd2hlbiBgbG9hZFR5cGVgIGlzIGBSZXNvdXJjZS5MT0FEX1RZUEUuWEhSYC5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7WE1MSHR0cFJlcXVlc3R9XG4gICAgICAgICAqIEByZWFkb25seVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy54aHIgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgY2hpbGQgcmVzb3VyY2VzIHRoaXMgcmVzb3VyY2Ugb3ducy5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7UmVzb3VyY2VbXX1cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSByZXNvdXJjZSB0eXBlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtSZXNvdXJjZS5UWVBFfVxuICAgICAgICAgKiBAcmVhZG9ubHlcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHlwZSA9IFJlc291cmNlLlRZUEUuVU5LTk9XTjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2dyZXNzIGNodW5rIG93bmVkIGJ5IHRoaXMgcmVzb3VyY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBtZW1iZXIge251bWJlcn1cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnByb2dyZXNzQ2h1bmsgPSAwO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYGRlcXVldWVgIG1ldGhvZCB0aGF0IHdpbGwgYmUgdXNlZCBhIHN0b3JhZ2UgcGxhY2UgZm9yIHRoZSBhc3luYyBxdWV1ZSBkZXF1ZXVlIG1ldGhvZFxuICAgICAgICAgKiB1c2VkIHByaXZhdGVseSBieSB0aGUgbG9hZGVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAbWVtYmVyIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2RlcXVldWUgPSBfbm9vcDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVXNlZCBhIHN0b3JhZ2UgcGxhY2UgZm9yIHRoZSBvbiBsb2FkIGJpbmRpbmcgdXNlZCBwcml2YXRlbHkgYnkgdGhlIGxvYWRlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQG1lbWJlciB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9vbkxvYWRCaW5kaW5nID0gbnVsbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGBjb21wbGV0ZWAgZnVuY3Rpb24gYm91bmQgdG8gdGhpcyByZXNvdXJjZSdzIGNvbnRleHQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fYm91bmRDb21wbGV0ZSA9IHRoaXMuY29tcGxldGUuYmluZCh0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGBfb25FcnJvcmAgZnVuY3Rpb24gYm91bmQgdG8gdGhpcyByZXNvdXJjZSdzIGNvbnRleHQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBtZW1iZXIge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fYm91bmRPbkVycm9yID0gdGhpcy5fb25FcnJvci5iaW5kKHRoaXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYF9vblByb2dyZXNzYCBmdW5jdGlvbiBib3VuZCB0byB0aGlzIHJlc291cmNlJ3MgY29udGV4dC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQG1lbWJlciB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ib3VuZE9uUHJvZ3Jlc3MgPSB0aGlzLl9vblByb2dyZXNzLmJpbmQodGhpcyk7XG5cbiAgICAgICAgLy8geGhyIGNhbGxiYWNrc1xuICAgICAgICB0aGlzLl9ib3VuZFhock9uRXJyb3IgPSB0aGlzLl94aHJPbkVycm9yLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX2JvdW5kWGhyT25BYm9ydCA9IHRoaXMuX3hock9uQWJvcnQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fYm91bmRYaHJPbkxvYWQgPSB0aGlzLl94aHJPbkxvYWQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fYm91bmRYZHJPblRpbWVvdXQgPSB0aGlzLl94ZHJPblRpbWVvdXQuYmluZCh0aGlzKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzcGF0Y2hlZCB3aGVuIHRoZSByZXNvdXJjZSBiZWluZ3MgdG8gbG9hZC5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNhbGxiYWNrIGxvb2tzIGxpa2Uge0BsaW5rIFJlc291cmNlLk9uU3RhcnRTaWduYWx9LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtTaWduYWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uU3RhcnQgPSBuZXcgX21pbmlTaWduYWxzMi5kZWZhdWx0KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BhdGNoZWQgZWFjaCB0aW1lIHByb2dyZXNzIG9mIHRoaXMgcmVzb3VyY2UgbG9hZCB1cGRhdGVzLlxuICAgICAgICAgKiBOb3QgYWxsIHJlc291cmNlcyB0eXBlcyBhbmQgbG9hZGVyIHN5c3RlbXMgY2FuIHN1cHBvcnQgdGhpcyBldmVudFxuICAgICAgICAgKiBzbyBzb21ldGltZXMgaXQgbWF5IG5vdCBiZSBhdmFpbGFibGUuIElmIHRoZSByZXNvdXJjZVxuICAgICAgICAgKiBpcyBiZWluZyBsb2FkZWQgb24gYSBtb2Rlcm4gYnJvd3NlciwgdXNpbmcgWEhSLCBhbmQgdGhlIHJlbW90ZSBzZXJ2ZXJcbiAgICAgICAgICogcHJvcGVybHkgc2V0cyBDb250ZW50LUxlbmd0aCBoZWFkZXJzLCB0aGVuIHRoaXMgd2lsbCBiZSBhdmFpbGFibGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBjYWxsYmFjayBsb29rcyBsaWtlIHtAbGluayBSZXNvdXJjZS5PblByb2dyZXNzU2lnbmFsfS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7U2lnbmFsfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vblByb2dyZXNzID0gbmV3IF9taW5pU2lnbmFsczIuZGVmYXVsdCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEaXNwYXRjaGVkIG9uY2UgdGhpcyByZXNvdXJjZSBoYXMgbG9hZGVkLCBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgaXQgd2lsbFxuICAgICAgICAgKiBiZSBpbiB0aGUgYGVycm9yYCBwcm9wZXJ0eS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNhbGxiYWNrIGxvb2tzIGxpa2Uge0BsaW5rIFJlc291cmNlLk9uQ29tcGxldGVTaWduYWx9LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtTaWduYWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uQ29tcGxldGUgPSBuZXcgX21pbmlTaWduYWxzMi5kZWZhdWx0KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BhdGNoZWQgYWZ0ZXIgdGhpcyByZXNvdXJjZSBoYXMgaGFkIGFsbCB0aGUgKmFmdGVyKiBtaWRkbGV3YXJlIHJ1biBvbiBpdC5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGNhbGxiYWNrIGxvb2tzIGxpa2Uge0BsaW5rIFJlc291cmNlLk9uQ29tcGxldGVTaWduYWx9LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyIHtTaWduYWx9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm9uQWZ0ZXJNaWRkbGV3YXJlID0gbmV3IF9taW5pU2lnbmFsczIuZGVmYXVsdCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVuIHRoZSByZXNvdXJjZSBzdGFydHMgdG8gbG9hZC5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlcm9mIFJlc291cmNlXG4gICAgICAgICAqIEBjYWxsYmFjayBPblN0YXJ0U2lnbmFsXG4gICAgICAgICAqIEBwYXJhbSB7UmVzb3VyY2V9IHJlc291cmNlIC0gVGhlIHJlc291cmNlIHRoYXQgdGhlIGV2ZW50IGhhcHBlbmVkIG9uLlxuICAgICAgICAgKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hlbiB0aGUgcmVzb3VyY2UgcmVwb3J0cyBsb2FkaW5nIHByb2dyZXNzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVzb3VyY2VcbiAgICAgICAgICogQGNhbGxiYWNrIE9uUHJvZ3Jlc3NTaWduYWxcbiAgICAgICAgICogQHBhcmFtIHtSZXNvdXJjZX0gcmVzb3VyY2UgLSBUaGUgcmVzb3VyY2UgdGhhdCB0aGUgZXZlbnQgaGFwcGVuZWQgb24uXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJjZW50YWdlIC0gVGhlIHByb2dyZXNzIG9mIHRoZSBsb2FkIGluIHRoZSByYW5nZSBbMCwgMV0uXG4gICAgICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGVuIHRoZSByZXNvdXJjZSBmaW5pc2hlcyBsb2FkaW5nLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVzb3VyY2VcbiAgICAgICAgICogQGNhbGxiYWNrIE9uQ29tcGxldGVTaWduYWxcbiAgICAgICAgICogQHBhcmFtIHtSZXNvdXJjZX0gcmVzb3VyY2UgLSBUaGUgcmVzb3VyY2UgdGhhdCB0aGUgZXZlbnQgaGFwcGVuZWQgb24uXG4gICAgICAgICAqL1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3JlcyB3aGV0aGVyIG9yIG5vdCB0aGlzIHVybCBpcyBhIGRhdGEgdXJsLlxuICAgICAqXG4gICAgICogQG1lbWJlciB7Ym9vbGVhbn1cbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cblxuXG4gICAgLyoqXG4gICAgICogTWFya3MgdGhlIHJlc291cmNlIGFzIGNvbXBsZXRlLlxuICAgICAqXG4gICAgICovXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLmNvbXBsZXRlID0gZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICAgIC8vIFRPRE86IENsZWFuIHRoaXMgdXAgaW4gYSB3cmFwcGVyIG9yIHNvbWV0aGluZy4uLmdyb3NzLi4uLlxuICAgICAgICBpZiAodGhpcy5kYXRhICYmIHRoaXMuZGF0YS5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzLl9ib3VuZE9uRXJyb3IsIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgdGhpcy5fYm91bmRDb21wbGV0ZSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5kYXRhLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgdGhpcy5fYm91bmRPblByb2dyZXNzLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmRhdGEucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2FucGxheXRocm91Z2gnLCB0aGlzLl9ib3VuZENvbXBsZXRlLCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy54aHIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnhoci5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy54aHIucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzLl9ib3VuZFhock9uRXJyb3IsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnhoci5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIHRoaXMuX2JvdW5kWGhyT25BYm9ydCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMueGhyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgdGhpcy5fYm91bmRPblByb2dyZXNzLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy54aHIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIHRoaXMuX2JvdW5kWGhyT25Mb2FkLCBmYWxzZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMueGhyLm9uZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMueGhyLm9udGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy54aHIub25wcm9ncmVzcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy54aHIub25sb2FkID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmlzQ29tcGxldGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29tcGxldGUgY2FsbGVkIGFnYWluIGZvciBhbiBhbHJlYWR5IGNvbXBsZXRlZCByZXNvdXJjZS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3NldEZsYWcoUmVzb3VyY2UuU1RBVFVTX0ZMQUdTLkNPTVBMRVRFLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fc2V0RmxhZyhSZXNvdXJjZS5TVEFUVVNfRkxBR1MuTE9BRElORywgZmFsc2UpO1xuXG4gICAgICAgIHRoaXMub25Db21wbGV0ZS5kaXNwYXRjaCh0aGlzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWJvcnRzIHRoZSBsb2FkaW5nIG9mIHRoaXMgcmVzb3VyY2UsIHdpdGggYW4gb3B0aW9uYWwgbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdG8gdXNlIGZvciB0aGUgZXJyb3JcbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLmFib3J0ID0gZnVuY3Rpb24gYWJvcnQobWVzc2FnZSkge1xuICAgICAgICAvLyBhYm9ydCBjYW4gYmUgY2FsbGVkIG11bHRpcGxlIHRpbWVzLCBpZ25vcmUgc3Vic2VxdWVudCBjYWxscy5cbiAgICAgICAgaWYgKHRoaXMuZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN0b3JlIGVycm9yXG4gICAgICAgIHRoaXMuZXJyb3IgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG5cbiAgICAgICAgLy8gYWJvcnQgdGhlIGFjdHVhbCBsb2FkaW5nXG4gICAgICAgIGlmICh0aGlzLnhocikge1xuICAgICAgICAgICAgdGhpcy54aHIuYWJvcnQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnhkcikge1xuICAgICAgICAgICAgdGhpcy54ZHIuYWJvcnQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRhdGEpIHtcbiAgICAgICAgICAgIC8vIHNpbmdsZSBzb3VyY2VcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGEuc3JjKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLnNyYyA9IFJlc291cmNlLkVNUFRZX0dJRjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIG11bHRpLXNvdXJjZVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0aGlzLmRhdGEuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLnJlbW92ZUNoaWxkKHRoaXMuZGF0YS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRvbmUgbm93LlxuICAgICAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEtpY2tzIG9mZiBsb2FkaW5nIG9mIHRoaXMgcmVzb3VyY2UuIFRoaXMgbWV0aG9kIGlzIGFzeW5jaHJvbm91cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjYl0gLSBPcHRpb25hbCBjYWxsYmFjayB0byBjYWxsIG9uY2UgdGhlIHJlc291cmNlIGlzIGxvYWRlZC5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiBsb2FkKGNiKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc0NvbXBsZXRlKSB7XG4gICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNiKF90aGlzKTtcbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKGNiKSB7XG4gICAgICAgICAgICB0aGlzLm9uQ29tcGxldGUub25jZShjYik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zZXRGbGFnKFJlc291cmNlLlNUQVRVU19GTEFHUy5MT0FESU5HLCB0cnVlKTtcblxuICAgICAgICB0aGlzLm9uU3RhcnQuZGlzcGF0Y2godGhpcyk7XG5cbiAgICAgICAgLy8gaWYgdW5zZXQsIGRldGVybWluZSB0aGUgdmFsdWVcbiAgICAgICAgaWYgKHRoaXMuY3Jvc3NPcmlnaW4gPT09IGZhbHNlIHx8IHR5cGVvZiB0aGlzLmNyb3NzT3JpZ2luICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5jcm9zc09yaWdpbiA9IHRoaXMuX2RldGVybWluZUNyb3NzT3JpZ2luKHRoaXMudXJsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy5sb2FkVHlwZSkge1xuICAgICAgICAgICAgY2FzZSBSZXNvdXJjZS5MT0FEX1RZUEUuSU1BR0U6XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gUmVzb3VyY2UuVFlQRS5JTUFHRTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2FkRWxlbWVudCgnaW1hZ2UnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBSZXNvdXJjZS5MT0FEX1RZUEUuQVVESU86XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gUmVzb3VyY2UuVFlQRS5BVURJTztcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2FkU291cmNlRWxlbWVudCgnYXVkaW8nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBSZXNvdXJjZS5MT0FEX1RZUEUuVklERU86XG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gUmVzb3VyY2UuVFlQRS5WSURFTztcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2FkU291cmNlRWxlbWVudCgndmlkZW8nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSBSZXNvdXJjZS5MT0FEX1RZUEUuWEhSOlxuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBpZiAodXNlWGRyICYmIHRoaXMuY3Jvc3NPcmlnaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9hZFhkcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvYWRYaHIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSBmbGFnIGlzIHNldC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGZsYWcgLSBUaGUgZmxhZyB0byBjaGVjay5cbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBmbGFnIGlzIHNldC5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9oYXNGbGFnID0gZnVuY3Rpb24gX2hhc0ZsYWcoZmxhZykge1xuICAgICAgICByZXR1cm4gISEodGhpcy5fZmxhZ3MgJiBmbGFnKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogKFVuKVNldHMgdGhlIGZsYWcuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmbGFnIC0gVGhlIGZsYWcgdG8gKHVuKXNldC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlIC0gV2hldGhlciB0byBzZXQgb3IgKHVuKXNldCB0aGUgZmxhZy5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9zZXRGbGFnID0gZnVuY3Rpb24gX3NldEZsYWcoZmxhZywgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5fZmxhZ3MgPSB2YWx1ZSA/IHRoaXMuX2ZsYWdzIHwgZmxhZyA6IHRoaXMuX2ZsYWdzICYgfmZsYWc7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIExvYWRzIHRoaXMgcmVzb3VyY2VzIHVzaW5nIGFuIGVsZW1lbnQgdGhhdCBoYXMgYSBzaW5nbGUgc291cmNlLFxuICAgICAqIGxpa2UgYW4gSFRNTEltYWdlRWxlbWVudC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBUaGUgdHlwZSBvZiBlbGVtZW50IHRvIHVzZS5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9sb2FkRWxlbWVudCA9IGZ1bmN0aW9uIF9sb2FkRWxlbWVudCh0eXBlKSB7XG4gICAgICAgIGlmICh0aGlzLm1ldGFkYXRhLmxvYWRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSB0aGlzLm1ldGFkYXRhLmxvYWRFbGVtZW50O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdpbWFnZScgJiYgdHlwZW9mIHdpbmRvdy5JbWFnZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmNyb3NzT3JpZ2luKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEuY3Jvc3NPcmlnaW4gPSB0aGlzLmNyb3NzT3JpZ2luO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLm1ldGFkYXRhLnNraXBTb3VyY2UpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zcmMgPSB0aGlzLnVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGF0YS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHRoaXMuX2JvdW5kT25FcnJvciwgZmFsc2UpO1xuICAgICAgICB0aGlzLmRhdGEuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHRoaXMuX2JvdW5kQ29tcGxldGUsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5kYXRhLmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgdGhpcy5fYm91bmRPblByb2dyZXNzLCBmYWxzZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIExvYWRzIHRoaXMgcmVzb3VyY2VzIHVzaW5nIGFuIGVsZW1lbnQgdGhhdCBoYXMgbXVsdGlwbGUgc291cmNlcyxcbiAgICAgKiBsaWtlIGFuIEhUTUxBdWRpb0VsZW1lbnQgb3IgSFRNTFZpZGVvRWxlbWVudC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBUaGUgdHlwZSBvZiBlbGVtZW50IHRvIHVzZS5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9sb2FkU291cmNlRWxlbWVudCA9IGZ1bmN0aW9uIF9sb2FkU291cmNlRWxlbWVudCh0eXBlKSB7XG4gICAgICAgIGlmICh0aGlzLm1ldGFkYXRhLmxvYWRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSB0aGlzLm1ldGFkYXRhLmxvYWRFbGVtZW50O1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdhdWRpbycgJiYgdHlwZW9mIHdpbmRvdy5BdWRpbyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IG5ldyBBdWRpbygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYWJvcnQoJ1Vuc3VwcG9ydGVkIGVsZW1lbnQ6ICcgKyB0eXBlKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLm1ldGFkYXRhLnNraXBTb3VyY2UpIHtcbiAgICAgICAgICAgIC8vIHN1cHBvcnQgZm9yIENvY29vbkpTIENhbnZhcysgcnVudGltZSwgbGFja3MgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJylcbiAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IuaXNDb2Nvb25KUykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5zcmMgPSBBcnJheS5pc0FycmF5KHRoaXMudXJsKSA/IHRoaXMudXJsWzBdIDogdGhpcy51cmw7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodGhpcy51cmwpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pbWVUeXBlcyA9IHRoaXMubWV0YWRhdGEubWltZVR5cGU7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudXJsLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5hcHBlbmRDaGlsZCh0aGlzLl9jcmVhdGVTb3VyY2UodHlwZSwgdGhpcy51cmxbaV0sIEFycmF5LmlzQXJyYXkobWltZVR5cGVzKSA/IG1pbWVUeXBlc1tpXSA6IG1pbWVUeXBlcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIF9taW1lVHlwZXMgPSB0aGlzLm1ldGFkYXRhLm1pbWVUeXBlO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmFwcGVuZENoaWxkKHRoaXMuX2NyZWF0ZVNvdXJjZSh0eXBlLCB0aGlzLnVybCwgQXJyYXkuaXNBcnJheShfbWltZVR5cGVzKSA/IF9taW1lVHlwZXNbMF0gOiBfbWltZVR5cGVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRhdGEuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzLl9ib3VuZE9uRXJyb3IsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5kYXRhLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB0aGlzLl9ib3VuZENvbXBsZXRlLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZGF0YS5hZGRFdmVudExpc3RlbmVyKCdwcm9ncmVzcycsIHRoaXMuX2JvdW5kT25Qcm9ncmVzcywgZmFsc2UpO1xuICAgICAgICB0aGlzLmRhdGEuYWRkRXZlbnRMaXN0ZW5lcignY2FucGxheXRocm91Z2gnLCB0aGlzLl9ib3VuZENvbXBsZXRlLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5kYXRhLmxvYWQoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTG9hZHMgdGhpcyByZXNvdXJjZXMgdXNpbmcgYW4gWE1MSHR0cFJlcXVlc3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX2xvYWRYaHIgPSBmdW5jdGlvbiBfbG9hZFhocigpIHtcbiAgICAgICAgLy8gaWYgdW5zZXQsIGRldGVybWluZSB0aGUgdmFsdWVcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnhoclR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLnhoclR5cGUgPSB0aGlzLl9kZXRlcm1pbmVYaHJUeXBlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeGhyID0gdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAvLyBzZXQgdGhlIHJlcXVlc3QgdHlwZSBhbmQgdXJsXG4gICAgICAgIHhoci5vcGVuKCdHRVQnLCB0aGlzLnVybCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gbG9hZCBqc29uIGFzIHRleHQgYW5kIHBhcnNlIGl0IG91cnNlbHZlcy4gV2UgZG8gdGhpcyBiZWNhdXNlIHNvbWUgYnJvd3NlcnNcbiAgICAgICAgLy8gKmNvdWdoKiBzYWZhcmkgKmNvdWdoKiBjYW4ndCBkZWFsIHdpdGggaXQuXG4gICAgICAgIGlmICh0aGlzLnhoclR5cGUgPT09IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkpTT04gfHwgdGhpcy54aHJUeXBlID09PSBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ET0NVTUVOVCkge1xuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLlRFWFQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gdGhpcy54aHJUeXBlO1xuICAgICAgICB9XG5cbiAgICAgICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcy5fYm91bmRYaHJPbkVycm9yLCBmYWxzZSk7XG4gICAgICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIHRoaXMuX2JvdW5kWGhyT25BYm9ydCwgZmFsc2UpO1xuICAgICAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCB0aGlzLl9ib3VuZE9uUHJvZ3Jlc3MsIGZhbHNlKTtcbiAgICAgICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB0aGlzLl9ib3VuZFhock9uTG9hZCwgZmFsc2UpO1xuXG4gICAgICAgIHhoci5zZW5kKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIExvYWRzIHRoaXMgcmVzb3VyY2VzIHVzaW5nIGFuIFhEb21haW5SZXF1ZXN0LiBUaGlzIGlzIGhlcmUgYmVjYXVzZSB3ZSBuZWVkIHRvIHN1cHBvcnQgSUU5IChncm9zcykuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX2xvYWRYZHIgPSBmdW5jdGlvbiBfbG9hZFhkcigpIHtcbiAgICAgICAgLy8gaWYgdW5zZXQsIGRldGVybWluZSB0aGUgdmFsdWVcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnhoclR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLnhoclR5cGUgPSB0aGlzLl9kZXRlcm1pbmVYaHJUeXBlKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgeGRyID0gdGhpcy54aHIgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcblxuICAgICAgICAvLyBYRG9tYWluUmVxdWVzdCBoYXMgYSBmZXcgcXVpcmtzLiBPY2Nhc2lvbmFsbHkgaXQgd2lsbCBhYm9ydCByZXF1ZXN0c1xuICAgICAgICAvLyBBIHdheSB0byBhdm9pZCB0aGlzIGlzIHRvIG1ha2Ugc3VyZSBBTEwgY2FsbGJhY2tzIGFyZSBzZXQgZXZlbiBpZiBub3QgdXNlZFxuICAgICAgICAvLyBNb3JlIGluZm8gaGVyZTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNTc4Njk2Ni94ZG9tYWlucmVxdWVzdC1hYm9ydHMtcG9zdC1vbi1pZS05XG4gICAgICAgIHhkci50aW1lb3V0ID0gNTAwMDtcblxuICAgICAgICB4ZHIub25lcnJvciA9IHRoaXMuX2JvdW5kWGhyT25FcnJvcjtcbiAgICAgICAgeGRyLm9udGltZW91dCA9IHRoaXMuX2JvdW5kWGRyT25UaW1lb3V0O1xuICAgICAgICB4ZHIub25wcm9ncmVzcyA9IHRoaXMuX2JvdW5kT25Qcm9ncmVzcztcbiAgICAgICAgeGRyLm9ubG9hZCA9IHRoaXMuX2JvdW5kWGhyT25Mb2FkO1xuXG4gICAgICAgIHhkci5vcGVuKCdHRVQnLCB0aGlzLnVybCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gTm90ZTogVGhlIHhkci5zZW5kKCkgY2FsbCBpcyB3cmFwcGVkIGluIGEgdGltZW91dCB0byBwcmV2ZW50IGFuXG4gICAgICAgIC8vIGlzc3VlIHdpdGggdGhlIGludGVyZmFjZSB3aGVyZSBzb21lIHJlcXVlc3RzIGFyZSBsb3N0IGlmIG11bHRpcGxlXG4gICAgICAgIC8vIFhEb21haW5SZXF1ZXN0cyBhcmUgYmVpbmcgc2VudCBhdCB0aGUgc2FtZSB0aW1lLlxuICAgICAgICAvLyBTb21lIGluZm8gaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL3Bob3RvbnN0b3JtL3BoYXNlci9pc3N1ZXMvMTI0OFxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB4ZHIuc2VuZCgpO1xuICAgICAgICB9LCAxKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHNvdXJjZSB1c2VkIGluIGxvYWRpbmcgdmlhIGFuIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gVGhlIGVsZW1lbnQgdHlwZSAodmlkZW8gb3IgYXVkaW8pLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSBUaGUgc291cmNlIFVSTCB0byBsb2FkIGZyb20uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFttaW1lXSAtIFRoZSBtaW1lIHR5cGUgb2YgdGhlIHZpZGVvXG4gICAgICogQHJldHVybiB7SFRNTFNvdXJjZUVsZW1lbnR9IFRoZSBzb3VyY2UgZWxlbWVudC5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9jcmVhdGVTb3VyY2UgPSBmdW5jdGlvbiBfY3JlYXRlU291cmNlKHR5cGUsIHVybCwgbWltZSkge1xuICAgICAgICBpZiAoIW1pbWUpIHtcbiAgICAgICAgICAgIG1pbWUgPSB0eXBlICsgJy8nICsgdGhpcy5fZ2V0RXh0ZW5zaW9uKHVybCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc291cmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XG5cbiAgICAgICAgc291cmNlLnNyYyA9IHVybDtcbiAgICAgICAgc291cmNlLnR5cGUgPSBtaW1lO1xuXG4gICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBpZiBhIGxvYWQgZXJyb3JzIG91dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gVGhlIGVycm9yIGV2ZW50IGZyb20gdGhlIGVsZW1lbnQgdGhhdCBlbWl0cyBpdC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX29uRXJyb3IgPSBmdW5jdGlvbiBfb25FcnJvcihldmVudCkge1xuICAgICAgICB0aGlzLmFib3J0KCdGYWlsZWQgdG8gbG9hZCBlbGVtZW50IHVzaW5nOiAnICsgZXZlbnQudGFyZ2V0Lm5vZGVOYW1lKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGlmIGEgbG9hZCBwcm9ncmVzcyBldmVudCBmaXJlcyBmb3IgeGhyL3hkci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtYTUxIdHRwUmVxdWVzdFByb2dyZXNzRXZlbnR8RXZlbnR9IGV2ZW50IC0gUHJvZ3Jlc3MgZXZlbnQuXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5fb25Qcm9ncmVzcyA9IGZ1bmN0aW9uIF9vblByb2dyZXNzKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudCAmJiBldmVudC5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLm9uUHJvZ3Jlc3MuZGlzcGF0Y2godGhpcywgZXZlbnQubG9hZGVkIC8gZXZlbnQudG90YWwpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBpZiBhbiBlcnJvciBldmVudCBmaXJlcyBmb3IgeGhyL3hkci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtYTUxIdHRwUmVxdWVzdEVycm9yRXZlbnR8RXZlbnR9IGV2ZW50IC0gRXJyb3IgZXZlbnQuXG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5feGhyT25FcnJvciA9IGZ1bmN0aW9uIF94aHJPbkVycm9yKCkge1xuICAgICAgICB2YXIgeGhyID0gdGhpcy54aHI7XG5cbiAgICAgICAgdGhpcy5hYm9ydChyZXFUeXBlKHhocikgKyAnIFJlcXVlc3QgZmFpbGVkLiBTdGF0dXM6ICcgKyB4aHIuc3RhdHVzICsgJywgdGV4dDogXCInICsgeGhyLnN0YXR1c1RleHQgKyAnXCInKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGlmIGFuIGFib3J0IGV2ZW50IGZpcmVzIGZvciB4aHIuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7WE1MSHR0cFJlcXVlc3RBYm9ydEV2ZW50fSBldmVudCAtIEFib3J0IEV2ZW50XG4gICAgICovXG5cblxuICAgIFJlc291cmNlLnByb3RvdHlwZS5feGhyT25BYm9ydCA9IGZ1bmN0aW9uIF94aHJPbkFib3J0KCkge1xuICAgICAgICB0aGlzLmFib3J0KHJlcVR5cGUodGhpcy54aHIpICsgJyBSZXF1ZXN0IHdhcyBhYm9ydGVkIGJ5IHRoZSB1c2VyLicpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgaWYgYSB0aW1lb3V0IGV2ZW50IGZpcmVzIGZvciB4ZHIuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gVGltZW91dCBldmVudC5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl94ZHJPblRpbWVvdXQgPSBmdW5jdGlvbiBfeGRyT25UaW1lb3V0KCkge1xuICAgICAgICB0aGlzLmFib3J0KHJlcVR5cGUodGhpcy54aHIpICsgJyBSZXF1ZXN0IHRpbWVkIG91dC4nKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gZGF0YSBzdWNjZXNzZnVsbHkgbG9hZHMgZnJvbSBhbiB4aHIveGRyIHJlcXVlc3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB7WE1MSHR0cFJlcXVlc3RMb2FkRXZlbnR8RXZlbnR9IGV2ZW50IC0gTG9hZCBldmVudFxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX3hock9uTG9hZCA9IGZ1bmN0aW9uIF94aHJPbkxvYWQoKSB7XG4gICAgICAgIHZhciB4aHIgPSB0aGlzLnhocjtcbiAgICAgICAgdmFyIHRleHQgPSAnJztcbiAgICAgICAgdmFyIHN0YXR1cyA9IHR5cGVvZiB4aHIuc3RhdHVzID09PSAndW5kZWZpbmVkJyA/IFNUQVRVU19PSyA6IHhoci5zdGF0dXM7IC8vIFhEUiBoYXMgbm8gYC5zdGF0dXNgLCBhc3N1bWUgMjAwLlxuXG4gICAgICAgIC8vIHJlc3BvbnNlVGV4dCBpcyBhY2Nlc3NpYmxlIG9ubHkgaWYgcmVzcG9uc2VUeXBlIGlzICcnIG9yICd0ZXh0JyBhbmQgb24gb2xkZXIgYnJvd3NlcnNcbiAgICAgICAgaWYgKHhoci5yZXNwb25zZVR5cGUgPT09ICcnIHx8IHhoci5yZXNwb25zZVR5cGUgPT09ICd0ZXh0JyB8fCB0eXBlb2YgeGhyLnJlc3BvbnNlVHlwZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRleHQgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3RhdHVzIGNhbiBiZSAwIHdoZW4gdXNpbmcgdGhlIGBmaWxlOi8vYCBwcm90b2NvbCBzbyB3ZSBhbHNvIGNoZWNrIGlmIGEgcmVzcG9uc2UgaXMgc2V0LlxuICAgICAgICAvLyBJZiBpdCBoYXMgYSByZXNwb25zZSwgd2UgYXNzdW1lIDIwMDsgb3RoZXJ3aXNlIGEgMCBzdGF0dXMgY29kZSB3aXRoIG5vIGNvbnRlbnRzIGlzIGFuIGFib3J0ZWQgcmVxdWVzdC5cbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gU1RBVFVTX05PTkUgJiYgKHRleHQubGVuZ3RoID4gMCB8fCB4aHIucmVzcG9uc2VUeXBlID09PSBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CVUZGRVIpKSB7XG4gICAgICAgICAgICBzdGF0dXMgPSBTVEFUVVNfT0s7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaGFuZGxlIElFOSBidWc6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTAwNDY5NzIvbXNpZS1yZXR1cm5zLXN0YXR1cy1jb2RlLW9mLTEyMjMtZm9yLWFqYXgtcmVxdWVzdFxuICAgICAgICBlbHNlIGlmIChzdGF0dXMgPT09IFNUQVRVU19JRV9CVUdfRU1QVFkpIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSBTVEFUVVNfRU1QVFk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0YXR1c1R5cGUgPSBzdGF0dXMgLyAxMDAgfCAwO1xuXG4gICAgICAgIGlmIChzdGF0dXNUeXBlID09PSBTVEFUVVNfVFlQRV9PSykge1xuICAgICAgICAgICAgLy8gaWYgdGV4dCwganVzdCByZXR1cm4gaXRcbiAgICAgICAgICAgIGlmICh0aGlzLnhoclR5cGUgPT09IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLlRFWFQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEgPSB0ZXh0O1xuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IFJlc291cmNlLlRZUEUuVEVYVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIGpzb24sIHBhcnNlIGludG8ganNvbiBvYmplY3RcbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMueGhyVHlwZSA9PT0gUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuSlNPTikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZSh0ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IFJlc291cmNlLlRZUEUuSlNPTjtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hYm9ydCgnRXJyb3IgdHJ5aW5nIHRvIHBhcnNlIGxvYWRlZCBqc29uOiAnICsgZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBpZiB4bWwsIHBhcnNlIGludG8gYW4geG1sIGRvY3VtZW50IG9yIGRpdiBlbGVtZW50XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy54aHJUeXBlID09PSBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ET0NVTUVOVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93LkRPTVBhcnNlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZG9tcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRvbXBhcnNlci5wYXJzZUZyb21TdHJpbmcodGV4dCwgJ3RleHQveG1sJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSB0ZXh0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IGRpdjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBSZXNvdXJjZS5UWVBFLlhNTDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFib3J0KCdFcnJvciB0cnlpbmcgdG8gcGFyc2UgbG9hZGVkIHhtbDogJyArIGUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzIGp1c3QgcmV0dXJuIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEgPSB4aHIucmVzcG9uc2UgfHwgdGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWJvcnQoJ1snICsgeGhyLnN0YXR1cyArICddICcgKyB4aHIuc3RhdHVzVGV4dCArICc6ICcgKyB4aHIucmVzcG9uc2VVUkwpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGBjcm9zc09yaWdpbmAgcHJvcGVydHkgZm9yIHRoaXMgcmVzb3VyY2UgYmFzZWQgb24gaWYgdGhlIHVybFxuICAgICAqIGZvciB0aGlzIHJlc291cmNlIGlzIGNyb3NzLW9yaWdpbi4gSWYgY3Jvc3NPcmlnaW4gd2FzIG1hbnVhbGx5IHNldCwgdGhpc1xuICAgICAqIGZ1bmN0aW9uIGRvZXMgbm90aGluZy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIFRoZSB1cmwgdG8gdGVzdC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2xvYz13aW5kb3cubG9jYXRpb25dIC0gVGhlIGxvY2F0aW9uIG9iamVjdCB0byB0ZXN0IGFnYWluc3QuXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3Jvc3NPcmlnaW4gdmFsdWUgdG8gdXNlIChvciBlbXB0eSBzdHJpbmcgZm9yIG5vbmUpLlxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX2RldGVybWluZUNyb3NzT3JpZ2luID0gZnVuY3Rpb24gX2RldGVybWluZUNyb3NzT3JpZ2luKHVybCwgbG9jKSB7XG4gICAgICAgIC8vIGRhdGE6IGFuZCBqYXZhc2NyaXB0OiB1cmxzIGFyZSBjb25zaWRlcmVkIHNhbWUtb3JpZ2luXG4gICAgICAgIGlmICh1cmwuaW5kZXhPZignZGF0YTonKSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVmYXVsdCBpcyB3aW5kb3cubG9jYXRpb25cbiAgICAgICAgbG9jID0gbG9jIHx8IHdpbmRvdy5sb2NhdGlvbjtcblxuICAgICAgICBpZiAoIXRlbXBBbmNob3IpIHtcbiAgICAgICAgICAgIHRlbXBBbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsZXQgdGhlIGJyb3dzZXIgZGV0ZXJtaW5lIHRoZSBmdWxsIGhyZWYgZm9yIHRoZSB1cmwgb2YgdGhpcyByZXNvdXJjZSBhbmQgdGhlblxuICAgICAgICAvLyBwYXJzZSB3aXRoIHRoZSBub2RlIHVybCBsaWIsIHdlIGNhbid0IHVzZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgYW5jaG9yIGVsZW1lbnRcbiAgICAgICAgLy8gYmVjYXVzZSB0aGV5IGRvbid0IHdvcmsgaW4gSUU5IDooXG4gICAgICAgIHRlbXBBbmNob3IuaHJlZiA9IHVybDtcbiAgICAgICAgdXJsID0gKDAsIF9wYXJzZVVyaTIuZGVmYXVsdCkodGVtcEFuY2hvci5ocmVmLCB7IHN0cmljdE1vZGU6IHRydWUgfSk7XG5cbiAgICAgICAgdmFyIHNhbWVQb3J0ID0gIXVybC5wb3J0ICYmIGxvYy5wb3J0ID09PSAnJyB8fCB1cmwucG9ydCA9PT0gbG9jLnBvcnQ7XG4gICAgICAgIHZhciBwcm90b2NvbCA9IHVybC5wcm90b2NvbCA/IHVybC5wcm90b2NvbCArICc6JyA6ICcnO1xuXG4gICAgICAgIC8vIGlmIGNyb3NzIG9yaWdpblxuICAgICAgICBpZiAodXJsLmhvc3QgIT09IGxvYy5ob3N0bmFtZSB8fCAhc2FtZVBvcnQgfHwgcHJvdG9jb2wgIT09IGxvYy5wcm90b2NvbCkge1xuICAgICAgICAgICAgcmV0dXJuICdhbm9ueW1vdXMnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHRoZSByZXNwb25zZVR5cGUgb2YgYW4gWEhSIHJlcXVlc3QgYmFzZWQgb24gdGhlIGV4dGVuc2lvbiBvZiB0aGVcbiAgICAgKiByZXNvdXJjZSBiZWluZyBsb2FkZWQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEByZXR1cm4ge1Jlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFfSBUaGUgcmVzcG9uc2VUeXBlIHRvIHVzZS5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9kZXRlcm1pbmVYaHJUeXBlID0gZnVuY3Rpb24gX2RldGVybWluZVhoclR5cGUoKSB7XG4gICAgICAgIHJldHVybiBSZXNvdXJjZS5feGhyVHlwZU1hcFt0aGlzLmV4dGVuc2lvbl0gfHwgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuVEVYVDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB0aGUgbG9hZFR5cGUgb2YgYSByZXNvdXJjZSBiYXNlZCBvbiB0aGUgZXh0ZW5zaW9uIG9mIHRoZVxuICAgICAqIHJlc291cmNlIGJlaW5nIGxvYWRlZC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHJldHVybiB7UmVzb3VyY2UuTE9BRF9UWVBFfSBUaGUgbG9hZFR5cGUgdG8gdXNlLlxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX2RldGVybWluZUxvYWRUeXBlID0gZnVuY3Rpb24gX2RldGVybWluZUxvYWRUeXBlKCkge1xuICAgICAgICByZXR1cm4gUmVzb3VyY2UuX2xvYWRUeXBlTWFwW3RoaXMuZXh0ZW5zaW9uXSB8fCBSZXNvdXJjZS5MT0FEX1RZUEUuWEhSO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFeHRyYWN0cyB0aGUgZXh0ZW5zaW9uIChzYW5zICcuJykgb2YgdGhlIGZpbGUgYmVpbmcgbG9hZGVkIGJ5IHRoZSByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgZXh0ZW5zaW9uLlxuICAgICAqL1xuXG5cbiAgICBSZXNvdXJjZS5wcm90b3R5cGUuX2dldEV4dGVuc2lvbiA9IGZ1bmN0aW9uIF9nZXRFeHRlbnNpb24oKSB7XG4gICAgICAgIHZhciB1cmwgPSB0aGlzLnVybDtcbiAgICAgICAgdmFyIGV4dCA9ICcnO1xuXG4gICAgICAgIGlmICh0aGlzLmlzRGF0YVVybCkge1xuICAgICAgICAgICAgdmFyIHNsYXNoSW5kZXggPSB1cmwuaW5kZXhPZignLycpO1xuXG4gICAgICAgICAgICBleHQgPSB1cmwuc3Vic3RyaW5nKHNsYXNoSW5kZXggKyAxLCB1cmwuaW5kZXhPZignOycsIHNsYXNoSW5kZXgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBxdWVyeVN0YXJ0ID0gdXJsLmluZGV4T2YoJz8nKTtcbiAgICAgICAgICAgIHZhciBoYXNoU3RhcnQgPSB1cmwuaW5kZXhPZignIycpO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gTWF0aC5taW4ocXVlcnlTdGFydCA+IC0xID8gcXVlcnlTdGFydCA6IHVybC5sZW5ndGgsIGhhc2hTdGFydCA+IC0xID8gaGFzaFN0YXJ0IDogdXJsLmxlbmd0aCk7XG5cbiAgICAgICAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgZXh0ID0gdXJsLnN1YnN0cmluZyh1cmwubGFzdEluZGV4T2YoJy4nKSArIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4dC50b0xvd2VyQ2FzZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHRoZSBtaW1lIHR5cGUgb2YgYW4gWEhSIHJlcXVlc3QgYmFzZWQgb24gdGhlIHJlc3BvbnNlVHlwZSBvZlxuICAgICAqIHJlc291cmNlIGJlaW5nIGxvYWRlZC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIHtSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRX0gdHlwZSAtIFRoZSB0eXBlIHRvIGdldCBhIG1pbWUgdHlwZSBmb3IuXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgbWltZSB0eXBlIHRvIHVzZS5cbiAgICAgKi9cblxuXG4gICAgUmVzb3VyY2UucHJvdG90eXBlLl9nZXRNaW1lRnJvbVhoclR5cGUgPSBmdW5jdGlvbiBfZ2V0TWltZUZyb21YaHJUeXBlKHR5cGUpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJVRkZFUjpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL29jdGV0LWJpbmFyeSc7XG5cbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuQkxPQjpcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL2Jsb2InO1xuXG4gICAgICAgICAgICBjYXNlIFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkRPQ1VNRU5UOlxuICAgICAgICAgICAgICAgIHJldHVybiAnYXBwbGljYXRpb24veG1sJztcblxuICAgICAgICAgICAgY2FzZSBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5KU09OOlxuICAgICAgICAgICAgICAgIHJldHVybiAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuREVGQVVMVDpcbiAgICAgICAgICAgIGNhc2UgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuVEVYVDpcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuICd0ZXh0L3BsYWluJztcblxuICAgICAgICB9XG4gICAgfTtcblxuICAgIF9jcmVhdGVDbGFzcyhSZXNvdXJjZSwgW3tcbiAgICAgICAga2V5OiAnaXNEYXRhVXJsJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFzRmxhZyhSZXNvdXJjZS5TVEFUVVNfRkxBR1MuREFUQV9VUkwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlc2NyaWJlcyBpZiB0aGlzIHJlc291cmNlIGhhcyBmaW5pc2hlZCBsb2FkaW5nLiBJcyB0cnVlIHdoZW4gdGhlIHJlc291cmNlIGhhcyBjb21wbGV0ZWx5XG4gICAgICAgICAqIGxvYWRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7Ym9vbGVhbn1cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6ICdpc0NvbXBsZXRlJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGFzRmxhZyhSZXNvdXJjZS5TVEFUVVNfRkxBR1MuQ09NUExFVEUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlc2NyaWJlcyBpZiB0aGlzIHJlc291cmNlIGlzIGN1cnJlbnRseSBsb2FkaW5nLiBJcyB0cnVlIHdoZW4gdGhlIHJlc291cmNlIHN0YXJ0cyBsb2FkaW5nLFxuICAgICAgICAgKiBhbmQgaXMgZmFsc2UgYWdhaW4gd2hlbiBjb21wbGV0ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1lbWJlciB7Ym9vbGVhbn1cbiAgICAgICAgICogQHJlYWRvbmx5XG4gICAgICAgICAqL1xuXG4gICAgfSwge1xuICAgICAgICBrZXk6ICdpc0xvYWRpbmcnLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9oYXNGbGFnKFJlc291cmNlLlNUQVRVU19GTEFHUy5MT0FESU5HKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBSZXNvdXJjZTtcbn0oKTtcblxuLyoqXG4gKiBUaGUgdHlwZXMgb2YgcmVzb3VyY2VzIGEgcmVzb3VyY2UgY291bGQgcmVwcmVzZW50LlxuICpcbiAqIEBzdGF0aWNcbiAqIEByZWFkb25seVxuICogQGVudW0ge251bWJlcn1cbiAqL1xuXG5cbmV4cG9ydHMuZGVmYXVsdCA9IFJlc291cmNlO1xuUmVzb3VyY2UuU1RBVFVTX0ZMQUdTID0ge1xuICAgIE5PTkU6IDAsXG4gICAgREFUQV9VUkw6IDEgPDwgMCxcbiAgICBDT01QTEVURTogMSA8PCAxLFxuICAgIExPQURJTkc6IDEgPDwgMlxufTtcblxuLyoqXG4gKiBUaGUgdHlwZXMgb2YgcmVzb3VyY2VzIGEgcmVzb3VyY2UgY291bGQgcmVwcmVzZW50LlxuICpcbiAqIEBzdGF0aWNcbiAqIEByZWFkb25seVxuICogQGVudW0ge251bWJlcn1cbiAqL1xuUmVzb3VyY2UuVFlQRSA9IHtcbiAgICBVTktOT1dOOiAwLFxuICAgIEpTT046IDEsXG4gICAgWE1MOiAyLFxuICAgIElNQUdFOiAzLFxuICAgIEFVRElPOiA0LFxuICAgIFZJREVPOiA1LFxuICAgIFRFWFQ6IDZcbn07XG5cbi8qKlxuICogVGhlIHR5cGVzIG9mIGxvYWRpbmcgYSByZXNvdXJjZSBjYW4gdXNlLlxuICpcbiAqIEBzdGF0aWNcbiAqIEByZWFkb25seVxuICogQGVudW0ge251bWJlcn1cbiAqL1xuUmVzb3VyY2UuTE9BRF9UWVBFID0ge1xuICAgIC8qKiBVc2VzIFhNTEh0dHBSZXF1ZXN0IHRvIGxvYWQgdGhlIHJlc291cmNlLiAqL1xuICAgIFhIUjogMSxcbiAgICAvKiogVXNlcyBhbiBgSW1hZ2VgIG9iamVjdCB0byBsb2FkIHRoZSByZXNvdXJjZS4gKi9cbiAgICBJTUFHRTogMixcbiAgICAvKiogVXNlcyBhbiBgQXVkaW9gIG9iamVjdCB0byBsb2FkIHRoZSByZXNvdXJjZS4gKi9cbiAgICBBVURJTzogMyxcbiAgICAvKiogVXNlcyBhIGBWaWRlb2Agb2JqZWN0IHRvIGxvYWQgdGhlIHJlc291cmNlLiAqL1xuICAgIFZJREVPOiA0XG59O1xuXG4vKipcbiAqIFRoZSBYSFIgcmVhZHkgc3RhdGVzLCB1c2VkIGludGVybmFsbHkuXG4gKlxuICogQHN0YXRpY1xuICogQHJlYWRvbmx5XG4gKiBAZW51bSB7c3RyaW5nfVxuICovXG5SZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRSA9IHtcbiAgICAvKiogc3RyaW5nICovXG4gICAgREVGQVVMVDogJ3RleHQnLFxuICAgIC8qKiBBcnJheUJ1ZmZlciAqL1xuICAgIEJVRkZFUjogJ2FycmF5YnVmZmVyJyxcbiAgICAvKiogQmxvYiAqL1xuICAgIEJMT0I6ICdibG9iJyxcbiAgICAvKiogRG9jdW1lbnQgKi9cbiAgICBET0NVTUVOVDogJ2RvY3VtZW50JyxcbiAgICAvKiogT2JqZWN0ICovXG4gICAgSlNPTjogJ2pzb24nLFxuICAgIC8qKiBTdHJpbmcgKi9cbiAgICBURVhUOiAndGV4dCdcbn07XG5cblJlc291cmNlLl9sb2FkVHlwZU1hcCA9IHtcbiAgICAvLyBpbWFnZXNcbiAgICBnaWY6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBwbmc6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBibXA6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBqcGc6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBqcGVnOiBSZXNvdXJjZS5MT0FEX1RZUEUuSU1BR0UsXG4gICAgdGlmOiBSZXNvdXJjZS5MT0FEX1RZUEUuSU1BR0UsXG4gICAgdGlmZjogUmVzb3VyY2UuTE9BRF9UWVBFLklNQUdFLFxuICAgIHdlYnA6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICB0Z2E6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICBzdmc6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSxcbiAgICAnc3ZnK3htbCc6IFJlc291cmNlLkxPQURfVFlQRS5JTUFHRSwgLy8gZm9yIFNWRyBkYXRhIHVybHNcblxuICAgIC8vIGF1ZGlvXG4gICAgbXAzOiBSZXNvdXJjZS5MT0FEX1RZUEUuQVVESU8sXG4gICAgb2dnOiBSZXNvdXJjZS5MT0FEX1RZUEUuQVVESU8sXG4gICAgd2F2OiBSZXNvdXJjZS5MT0FEX1RZUEUuQVVESU8sXG5cbiAgICAvLyB2aWRlb3NcbiAgICBtcDQ6IFJlc291cmNlLkxPQURfVFlQRS5WSURFTyxcbiAgICB3ZWJtOiBSZXNvdXJjZS5MT0FEX1RZUEUuVklERU9cbn07XG5cblJlc291cmNlLl94aHJUeXBlTWFwID0ge1xuICAgIC8vIHhtbFxuICAgIHhodG1sOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ET0NVTUVOVCxcbiAgICBodG1sOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ET0NVTUVOVCxcbiAgICBodG06IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkRPQ1VNRU5ULFxuICAgIHhtbDogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuRE9DVU1FTlQsXG4gICAgdG14OiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5ET0NVTUVOVCxcbiAgICBzdmc6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkRPQ1VNRU5ULFxuXG4gICAgLy8gVGhpcyB3YXMgYWRkZWQgdG8gaGFuZGxlIFRpbGVkIFRpbGVzZXQgWE1MLCBidXQgLnRzeCBpcyBhbHNvIGEgVHlwZVNjcmlwdCBSZWFjdCBDb21wb25lbnQuXG4gICAgLy8gU2luY2UgaXQgaXMgd2F5IGxlc3MgbGlrZWx5IGZvciBwZW9wbGUgdG8gYmUgbG9hZGluZyBUeXBlU2NyaXB0IGZpbGVzIGluc3RlYWQgb2YgVGlsZWQgZmlsZXMsXG4gICAgLy8gdGhpcyBzaG91bGQgcHJvYmFibHkgYmUgZmluZS5cbiAgICB0c3g6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkRPQ1VNRU5ULFxuXG4gICAgLy8gaW1hZ2VzXG4gICAgZ2lmOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CTE9CLFxuICAgIHBuZzogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuQkxPQixcbiAgICBibXA6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJMT0IsXG4gICAganBnOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CTE9CLFxuICAgIGpwZWc6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJMT0IsXG4gICAgdGlmOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CTE9CLFxuICAgIHRpZmY6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJMT0IsXG4gICAgd2VicDogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuQkxPQixcbiAgICB0Z2E6IFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJMT0IsXG5cbiAgICAvLyBqc29uXG4gICAganNvbjogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuSlNPTixcblxuICAgIC8vIHRleHRcbiAgICB0ZXh0OiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5URVhULFxuICAgIHR4dDogUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuVEVYVCxcblxuICAgIC8vIGZvbnRzXG4gICAgdHRmOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CVUZGRVIsXG4gICAgb3RmOiBSZXNvdXJjZS5YSFJfUkVTUE9OU0VfVFlQRS5CVUZGRVJcbn07XG5cbi8vIFdlIGNhbid0IHNldCB0aGUgYHNyY2AgYXR0cmlidXRlIHRvIGVtcHR5IHN0cmluZywgc28gb24gYWJvcnQgd2Ugc2V0IGl0IHRvIHRoaXMgMXB4IHRyYW5zcGFyZW50IGdpZlxuUmVzb3VyY2UuRU1QVFlfR0lGID0gJ2RhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBSUFBQVAvLy93QUFBQ0g1QkFFQUFBQUFMQUFBQUFBQkFBRUFBQUlDUkFFQU93PT0nO1xuXG4vKipcbiAqIFF1aWNrIGhlbHBlciB0byBzZXQgYSB2YWx1ZSBvbiBvbmUgb2YgdGhlIGV4dGVuc2lvbiBtYXBzLiBFbnN1cmVzIHRoZXJlIGlzIG5vXG4gKiBkb3QgYXQgdGhlIHN0YXJ0IG9mIHRoZSBleHRlbnNpb24uXG4gKlxuICogQGlnbm9yZVxuICogQHBhcmFtIHtvYmplY3R9IG1hcCAtIFRoZSBtYXAgdG8gc2V0IG9uLlxuICogQHBhcmFtIHtzdHJpbmd9IGV4dG5hbWUgLSBUaGUgZXh0ZW5zaW9uIChvciBrZXkpIHRvIHNldC5cbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0LlxuICovXG5mdW5jdGlvbiBzZXRFeHRNYXAobWFwLCBleHRuYW1lLCB2YWwpIHtcbiAgICBpZiAoZXh0bmFtZSAmJiBleHRuYW1lLmluZGV4T2YoJy4nKSA9PT0gMCkge1xuICAgICAgICBleHRuYW1lID0gZXh0bmFtZS5zdWJzdHJpbmcoMSk7XG4gICAgfVxuXG4gICAgaWYgKCFleHRuYW1lKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBtYXBbZXh0bmFtZV0gPSB2YWw7XG59XG5cbi8qKlxuICogUXVpY2sgaGVscGVyIHRvIGdldCBzdHJpbmcgeGhyIHR5cGUuXG4gKlxuICogQGlnbm9yZVxuICogQHBhcmFtIHtYTUxIdHRwUmVxdWVzdHxYRG9tYWluUmVxdWVzdH0geGhyIC0gVGhlIHJlcXVlc3QgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB0eXBlLlxuICovXG5mdW5jdGlvbiByZXFUeXBlKHhocikge1xuICAgIHJldHVybiB4aHIudG9TdHJpbmcoKS5yZXBsYWNlKCdvYmplY3QgJywgJycpO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmVzb3VyY2UuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5lYWNoU2VyaWVzID0gZWFjaFNlcmllcztcbmV4cG9ydHMucXVldWUgPSBxdWV1ZTtcbi8qKlxuICogU21hbGxlciB2ZXJzaW9uIG9mIHRoZSBhc3luYyBsaWJyYXJ5IGNvbnN0cnVjdHMuXG4gKlxuICovXG5mdW5jdGlvbiBfbm9vcCgpIHt9IC8qIGVtcHR5ICovXG5cbi8qKlxuICogSXRlcmF0ZXMgYW4gYXJyYXkgaW4gc2VyaWVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXkuPCo+fSBhcnJheSAtIEFycmF5IHRvIGl0ZXJhdGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBpdGVyYXRvciAtIEZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggZWxlbWVudC5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gY2FsbCB3aGVuIGRvbmUsIG9yIG9uIGVycm9yLlxuICogQHBhcmFtIHtib29sZWFufSBbZGVmZXJOZXh0PWZhbHNlXSAtIEJyZWFrIHN5bmNocm9ub3VzIGVhY2ggbG9vcCBieSBjYWxsaW5nIG5leHQgd2l0aCBhIHNldFRpbWVvdXQgb2YgMS5cbiAqL1xuZnVuY3Rpb24gZWFjaFNlcmllcyhhcnJheSwgaXRlcmF0b3IsIGNhbGxiYWNrLCBkZWZlck5leHQpIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGxlbiA9IGFycmF5Lmxlbmd0aDtcblxuICAgIChmdW5jdGlvbiBuZXh0KGVycikge1xuICAgICAgICBpZiAoZXJyIHx8IGkgPT09IGxlbikge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlZmVyTmV4dCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoYXJyYXlbaSsrXSwgbmV4dCk7XG4gICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKGFycmF5W2krK10sIG5leHQpO1xuICAgICAgICB9XG4gICAgfSkoKTtcbn1cblxuLyoqXG4gKiBFbnN1cmVzIGEgZnVuY3Rpb24gaXMgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBmbiAtIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICogQHJldHVybiB7ZnVuY3Rpb259IFRoZSB3cmFwcGluZyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gb25seU9uY2UoZm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gb25jZVdyYXBwZXIoKSB7XG4gICAgICAgIGlmIChmbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYWxsYmFjayB3YXMgYWxyZWFkeSBjYWxsZWQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2FsbEZuID0gZm47XG5cbiAgICAgICAgZm4gPSBudWxsO1xuICAgICAgICBjYWxsRm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIEFzeW5jIHF1ZXVlIGltcGxlbWVudGF0aW9uLFxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHdvcmtlciAtIFRoZSB3b3JrZXIgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB0YXNrLlxuICogQHBhcmFtIHtudW1iZXJ9IGNvbmN1cnJlbmN5IC0gSG93IG1hbnkgd29ya2VycyB0byBydW4gaW4gcGFycmFsbGVsLlxuICogQHJldHVybiB7Kn0gVGhlIGFzeW5jIHF1ZXVlIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gcXVldWUod29ya2VyLCBjb25jdXJyZW5jeSkge1xuICAgIGlmIChjb25jdXJyZW5jeSA9PSBudWxsKSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXEtbnVsbCxlcWVxZXFcbiAgICAgICAgY29uY3VycmVuY3kgPSAxO1xuICAgIH0gZWxzZSBpZiAoY29uY3VycmVuY3kgPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25jdXJyZW5jeSBtdXN0IG5vdCBiZSB6ZXJvJyk7XG4gICAgfVxuXG4gICAgdmFyIHdvcmtlcnMgPSAwO1xuICAgIHZhciBxID0ge1xuICAgICAgICBfdGFza3M6IFtdLFxuICAgICAgICBjb25jdXJyZW5jeTogY29uY3VycmVuY3ksXG4gICAgICAgIHNhdHVyYXRlZDogX25vb3AsXG4gICAgICAgIHVuc2F0dXJhdGVkOiBfbm9vcCxcbiAgICAgICAgYnVmZmVyOiBjb25jdXJyZW5jeSAvIDQsXG4gICAgICAgIGVtcHR5OiBfbm9vcCxcbiAgICAgICAgZHJhaW46IF9ub29wLFxuICAgICAgICBlcnJvcjogX25vb3AsXG4gICAgICAgIHN0YXJ0ZWQ6IGZhbHNlLFxuICAgICAgICBwYXVzZWQ6IGZhbHNlLFxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfaW5zZXJ0KGRhdGEsIGZhbHNlLCBjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIGtpbGw6IGZ1bmN0aW9uIGtpbGwoKSB7XG4gICAgICAgICAgICB3b3JrZXJzID0gMDtcbiAgICAgICAgICAgIHEuZHJhaW4gPSBfbm9vcDtcbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgcS5fdGFza3MgPSBbXTtcbiAgICAgICAgfSxcbiAgICAgICAgdW5zaGlmdDogZnVuY3Rpb24gdW5zaGlmdChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgX2luc2VydChkYXRhLCB0cnVlLCBjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uIHByb2Nlc3MoKSB7XG4gICAgICAgICAgICB3aGlsZSAoIXEucGF1c2VkICYmIHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEuX3Rhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciB0YXNrID0gcS5fdGFza3Muc2hpZnQoKTtcblxuICAgICAgICAgICAgICAgIGlmIChxLl90YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdvcmtlcnMgKz0gMTtcblxuICAgICAgICAgICAgICAgIGlmICh3b3JrZXJzID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd29ya2VyKHRhc2suZGF0YSwgb25seU9uY2UoX25leHQodGFzaykpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbiBsZW5ndGgoKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5fdGFza3MubGVuZ3RoO1xuICAgICAgICB9LFxuICAgICAgICBydW5uaW5nOiBmdW5jdGlvbiBydW5uaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIGlkbGU6IGZ1bmN0aW9uIGlkbGUoKSB7XG4gICAgICAgICAgICByZXR1cm4gcS5fdGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMDtcbiAgICAgICAgfSxcbiAgICAgICAgcGF1c2U6IGZ1bmN0aW9uIHBhdXNlKCkge1xuICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBxLnBhdXNlZCA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3VtZTogZnVuY3Rpb24gcmVzdW1lKCkge1xuICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcS5wYXVzZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgLy8gTmVlZCB0byBjYWxsIHEucHJvY2VzcyBvbmNlIHBlciBjb25jdXJyZW50XG4gICAgICAgICAgICAvLyB3b3JrZXIgdG8gcHJlc2VydmUgZnVsbCBjb25jdXJyZW5jeSBhZnRlciBwYXVzZVxuICAgICAgICAgICAgZm9yICh2YXIgdyA9IDE7IHcgPD0gcS5jb25jdXJyZW5jeTsgdysrKSB7XG4gICAgICAgICAgICAgICAgcS5wcm9jZXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2luc2VydChkYXRhLCBpbnNlcnRBdEZyb250LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCAmJiB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXEtbnVsbCxlcWVxZXFcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGFzayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG5cbiAgICAgICAgaWYgKGRhdGEgPT0gbnVsbCAmJiBxLmlkbGUoKSkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1lcS1udWxsLGVxZXFlcVxuICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLmRyYWluKCk7XG4gICAgICAgICAgICB9LCAxKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgY2FsbGJhY2s6IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/IGNhbGxiYWNrIDogX25vb3BcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoaW5zZXJ0QXRGcm9udCkge1xuICAgICAgICAgICAgcS5fdGFza3MudW5zaGlmdChpdGVtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHEuX3Rhc2tzLnB1c2goaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBxLnByb2Nlc3MoKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX25leHQodGFzaykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgIHdvcmtlcnMgLT0gMTtcblxuICAgICAgICAgICAgdGFzay5jYWxsYmFjay5hcHBseSh0YXNrLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzWzBdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWVxLW51bGwsZXFlcWVxXG4gICAgICAgICAgICAgICAgcS5lcnJvcihhcmd1bWVudHNbMF0sIHRhc2suZGF0YSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh3b3JrZXJzIDw9IHEuY29uY3VycmVuY3kgLSBxLmJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIHEudW5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHEuaWRsZSgpKSB7XG4gICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBxLnByb2Nlc3MoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFzeW5jLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHMuZW5jb2RlQmluYXJ5ID0gZW5jb2RlQmluYXJ5O1xudmFyIF9rZXlTdHIgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz0nO1xuXG5mdW5jdGlvbiBlbmNvZGVCaW5hcnkoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0ID0gJyc7XG4gICAgdmFyIGlueCA9IDA7XG5cbiAgICB3aGlsZSAoaW54IDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgIC8vIEZpbGwgYnl0ZSBidWZmZXIgYXJyYXlcbiAgICAgICAgdmFyIGJ5dGVidWZmZXIgPSBbMCwgMCwgMF07XG4gICAgICAgIHZhciBlbmNvZGVkQ2hhckluZGV4ZXMgPSBbMCwgMCwgMCwgMF07XG5cbiAgICAgICAgZm9yICh2YXIgam54ID0gMDsgam54IDwgYnl0ZWJ1ZmZlci5sZW5ndGg7ICsram54KSB7XG4gICAgICAgICAgICBpZiAoaW54IDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgYXdheSBoaWdoLW9yZGVyIGJ5dGUsIGFzIGRvY3VtZW50ZWQgYXQ6XG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvRW4vVXNpbmdfWE1MSHR0cFJlcXVlc3QjSGFuZGxpbmdfYmluYXJ5X2RhdGFcbiAgICAgICAgICAgICAgICBieXRlYnVmZmVyW2pueF0gPSBpbnB1dC5jaGFyQ29kZUF0KGlueCsrKSAmIDB4ZmY7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJ5dGVidWZmZXJbam54XSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgZWFjaCBlbmNvZGVkIGNoYXJhY3RlciwgNiBiaXRzIGF0IGEgdGltZVxuICAgICAgICAvLyBpbmRleCAxOiBmaXJzdCA2IGJpdHNcbiAgICAgICAgZW5jb2RlZENoYXJJbmRleGVzWzBdID0gYnl0ZWJ1ZmZlclswXSA+PiAyO1xuXG4gICAgICAgIC8vIGluZGV4IDI6IHNlY29uZCA2IGJpdHMgKDIgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBmcm9tIGlucHV0IGJ5dGUgMSArIDQgbW9zdCBzaWduaWZpY2FudCBiaXRzIGZyb20gYnl0ZSAyKVxuICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbMV0gPSAoYnl0ZWJ1ZmZlclswXSAmIDB4MykgPDwgNCB8IGJ5dGVidWZmZXJbMV0gPj4gNDtcblxuICAgICAgICAvLyBpbmRleCAzOiB0aGlyZCA2IGJpdHMgKDQgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyBmcm9tIGlucHV0IGJ5dGUgMiArIDIgbW9zdCBzaWduaWZpY2FudCBiaXRzIGZyb20gYnl0ZSAzKVxuICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbMl0gPSAoYnl0ZWJ1ZmZlclsxXSAmIDB4MGYpIDw8IDIgfCBieXRlYnVmZmVyWzJdID4+IDY7XG5cbiAgICAgICAgLy8gaW5kZXggMzogZm9ydGggNiBiaXRzICg2IGxlYXN0IHNpZ25pZmljYW50IGJpdHMgZnJvbSBpbnB1dCBieXRlIDMpXG4gICAgICAgIGVuY29kZWRDaGFySW5kZXhlc1szXSA9IGJ5dGVidWZmZXJbMl0gJiAweDNmO1xuXG4gICAgICAgIC8vIERldGVybWluZSB3aGV0aGVyIHBhZGRpbmcgaGFwcGVuZWQsIGFuZCBhZGp1c3QgYWNjb3JkaW5nbHlcbiAgICAgICAgdmFyIHBhZGRpbmdCeXRlcyA9IGlueCAtIChpbnB1dC5sZW5ndGggLSAxKTtcblxuICAgICAgICBzd2l0Y2ggKHBhZGRpbmdCeXRlcykge1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIC8vIFNldCBsYXN0IDIgY2hhcmFjdGVycyB0byBwYWRkaW5nIGNoYXJcbiAgICAgICAgICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbM10gPSA2NDtcbiAgICAgICAgICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbMl0gPSA2NDtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIC8vIFNldCBsYXN0IGNoYXJhY3RlciB0byBwYWRkaW5nIGNoYXJcbiAgICAgICAgICAgICAgICBlbmNvZGVkQ2hhckluZGV4ZXNbM10gPSA2NDtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhazsgLy8gTm8gcGFkZGluZyAtIHByb2NlZWRcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdyB3ZSB3aWxsIGdyYWIgZWFjaCBhcHByb3ByaWF0ZSBjaGFyYWN0ZXIgb3V0IG9mIG91ciBrZXlzdHJpbmdcbiAgICAgICAgLy8gYmFzZWQgb24gb3VyIGluZGV4IGFycmF5IGFuZCBhcHBlbmQgaXQgdG8gdGhlIG91dHB1dCBzdHJpbmdcbiAgICAgICAgZm9yICh2YXIgX2pueCA9IDA7IF9qbnggPCBlbmNvZGVkQ2hhckluZGV4ZXMubGVuZ3RoOyArK19qbngpIHtcbiAgICAgICAgICAgIG91dHB1dCArPSBfa2V5U3RyLmNoYXJBdChlbmNvZGVkQ2hhckluZGV4ZXNbX2pueF0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWI2NC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbi8vIGltcG9ydCBMb2FkZXIgZnJvbSAnLi9Mb2FkZXInO1xuLy8gaW1wb3J0IFJlc291cmNlIGZyb20gJy4vUmVzb3VyY2UnO1xuLy8gaW1wb3J0ICogYXMgYXN5bmMgZnJvbSAnLi9hc3luYyc7XG4vLyBpbXBvcnQgKiBhcyBiNjQgZnJvbSAnLi9iNjQnO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuXG52YXIgTG9hZGVyID0gcmVxdWlyZSgnLi9Mb2FkZXInKS5kZWZhdWx0O1xudmFyIFJlc291cmNlID0gcmVxdWlyZSgnLi9SZXNvdXJjZScpLmRlZmF1bHQ7XG52YXIgYXN5bmMgPSByZXF1aXJlKCcuL2FzeW5jJyk7XG52YXIgYjY0ID0gcmVxdWlyZSgnLi9iNjQnKTtcblxuTG9hZGVyLlJlc291cmNlID0gUmVzb3VyY2U7XG5Mb2FkZXIuYXN5bmMgPSBhc3luYztcbkxvYWRlci5iYXNlNjQgPSBiNjQ7XG5cbi8vIGV4cG9ydCBtYW51YWxseSwgYW5kIGFsc28gYXMgZGVmYXVsdFxubW9kdWxlLmV4cG9ydHMgPSBMb2FkZXI7XG4vLyBleHBvcnQgZGVmYXVsdCBMb2FkZXI7XG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gTG9hZGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBNaW5pU2lnbmFsQmluZGluZyA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIE1pbmlTaWduYWxCaW5kaW5nKGZuLCBvbmNlLCB0aGlzQXJnKSB7XG4gICAgaWYgKG9uY2UgPT09IHVuZGVmaW5lZCkgb25jZSA9IGZhbHNlO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIE1pbmlTaWduYWxCaW5kaW5nKTtcblxuICAgIHRoaXMuX2ZuID0gZm47XG4gICAgdGhpcy5fb25jZSA9IG9uY2U7XG4gICAgdGhpcy5fdGhpc0FyZyA9IHRoaXNBcmc7XG4gICAgdGhpcy5fbmV4dCA9IHRoaXMuX3ByZXYgPSB0aGlzLl9vd25lciA9IG51bGw7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoTWluaVNpZ25hbEJpbmRpbmcsIFt7XG4gICAga2V5OiAnZGV0YWNoJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZGV0YWNoKCkge1xuICAgICAgaWYgKHRoaXMuX293bmVyID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgICB0aGlzLl9vd25lci5kZXRhY2godGhpcyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gTWluaVNpZ25hbEJpbmRpbmc7XG59KSgpO1xuXG5mdW5jdGlvbiBfYWRkTWluaVNpZ25hbEJpbmRpbmcoc2VsZiwgbm9kZSkge1xuICBpZiAoIXNlbGYuX2hlYWQpIHtcbiAgICBzZWxmLl9oZWFkID0gbm9kZTtcbiAgICBzZWxmLl90YWlsID0gbm9kZTtcbiAgfSBlbHNlIHtcbiAgICBzZWxmLl90YWlsLl9uZXh0ID0gbm9kZTtcbiAgICBub2RlLl9wcmV2ID0gc2VsZi5fdGFpbDtcbiAgICBzZWxmLl90YWlsID0gbm9kZTtcbiAgfVxuXG4gIG5vZGUuX293bmVyID0gc2VsZjtcblxuICByZXR1cm4gbm9kZTtcbn1cblxudmFyIE1pbmlTaWduYWwgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBNaW5pU2lnbmFsKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBNaW5pU2lnbmFsKTtcblxuICAgIHRoaXMuX2hlYWQgPSB0aGlzLl90YWlsID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKE1pbmlTaWduYWwsIFt7XG4gICAga2V5OiAnaGFuZGxlcnMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBoYW5kbGVycygpIHtcbiAgICAgIHZhciBleGlzdHMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgdmFyIG5vZGUgPSB0aGlzLl9oZWFkO1xuXG4gICAgICBpZiAoZXhpc3RzKSByZXR1cm4gISFub2RlO1xuXG4gICAgICB2YXIgZWUgPSBbXTtcblxuICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgZWUucHVzaChub2RlKTtcbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBlZTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdoYXMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBoYXMobm9kZSkge1xuICAgICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIE1pbmlTaWduYWxCaW5kaW5nKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pbmlTaWduYWwjaGFzKCk6IEZpcnN0IGFyZyBtdXN0IGJlIGEgTWluaVNpZ25hbEJpbmRpbmcgb2JqZWN0LicpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbm9kZS5fb3duZXIgPT09IHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZGlzcGF0Y2gnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNwYXRjaCgpIHtcbiAgICAgIHZhciBub2RlID0gdGhpcy5faGVhZDtcblxuICAgICAgaWYgKCFub2RlKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLl9vbmNlKSB0aGlzLmRldGFjaChub2RlKTtcbiAgICAgICAgbm9kZS5fZm4uYXBwbHkobm9kZS5fdGhpc0FyZywgYXJndW1lbnRzKTtcbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2FkZCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFkZChmbikge1xuICAgICAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBudWxsIDogYXJndW1lbnRzWzFdO1xuXG4gICAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWluaVNpZ25hbCNhZGQoKTogRmlyc3QgYXJnIG11c3QgYmUgYSBGdW5jdGlvbi4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfYWRkTWluaVNpZ25hbEJpbmRpbmcodGhpcywgbmV3IE1pbmlTaWduYWxCaW5kaW5nKGZuLCBmYWxzZSwgdGhpc0FyZykpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ29uY2UnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvbmNlKGZuKSB7XG4gICAgICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IG51bGwgOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaW5pU2lnbmFsI29uY2UoKTogRmlyc3QgYXJnIG11c3QgYmUgYSBGdW5jdGlvbi4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfYWRkTWluaVNpZ25hbEJpbmRpbmcodGhpcywgbmV3IE1pbmlTaWduYWxCaW5kaW5nKGZuLCB0cnVlLCB0aGlzQXJnKSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZGV0YWNoJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICAgIGlmICghKG5vZGUgaW5zdGFuY2VvZiBNaW5pU2lnbmFsQmluZGluZykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaW5pU2lnbmFsI2RldGFjaCgpOiBGaXJzdCBhcmcgbXVzdCBiZSBhIE1pbmlTaWduYWxCaW5kaW5nIG9iamVjdC4nKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLl9vd25lciAhPT0gdGhpcykgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGlmIChub2RlLl9wcmV2KSBub2RlLl9wcmV2Ll9uZXh0ID0gbm9kZS5fbmV4dDtcbiAgICAgIGlmIChub2RlLl9uZXh0KSBub2RlLl9uZXh0Ll9wcmV2ID0gbm9kZS5fcHJldjtcblxuICAgICAgaWYgKG5vZGUgPT09IHRoaXMuX2hlYWQpIHtcbiAgICAgICAgdGhpcy5faGVhZCA9IG5vZGUuX25leHQ7XG4gICAgICAgIGlmIChub2RlLl9uZXh0ID09PSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5fdGFpbCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobm9kZSA9PT0gdGhpcy5fdGFpbCkge1xuICAgICAgICB0aGlzLl90YWlsID0gbm9kZS5fcHJldjtcbiAgICAgICAgdGhpcy5fdGFpbC5fbmV4dCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIG5vZGUuX293bmVyID0gbnVsbDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2RldGFjaEFsbCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGRldGFjaEFsbCgpIHtcbiAgICAgIHZhciBub2RlID0gdGhpcy5faGVhZDtcbiAgICAgIGlmICghbm9kZSkgcmV0dXJuIHRoaXM7XG5cbiAgICAgIHRoaXMuX2hlYWQgPSB0aGlzLl90YWlsID0gbnVsbDtcblxuICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgbm9kZS5fb3duZXIgPSBudWxsO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBNaW5pU2lnbmFsO1xufSkoKTtcblxuTWluaVNpZ25hbC5NaW5pU2lnbmFsQmluZGluZyA9IE1pbmlTaWduYWxCaW5kaW5nO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSBNaW5pU2lnbmFsO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG4iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZVVSSSAoc3RyLCBvcHRzKSB7XG4gIG9wdHMgPSBvcHRzIHx8IHt9XG5cbiAgdmFyIG8gPSB7XG4gICAga2V5OiBbJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdhbmNob3InXSxcbiAgICBxOiB7XG4gICAgICBuYW1lOiAncXVlcnlLZXknLFxuICAgICAgcGFyc2VyOiAvKD86XnwmKShbXiY9XSopPT8oW14mXSopL2dcbiAgICB9LFxuICAgIHBhcnNlcjoge1xuICAgICAgc3RyaWN0OiAvXig/OihbXjpcXC8/I10rKTopPyg/OlxcL1xcLygoPzooKFteOkBdKikoPzo6KFteOkBdKikpPyk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSk/KCgoKD86W14/I1xcL10qXFwvKSopKFtePyNdKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvLFxuICAgICAgbG9vc2U6IC9eKD86KD8hW146QF0rOlteOkBcXC9dKkApKFteOlxcLz8jLl0rKTopPyg/OlxcL1xcLyk/KCg/OigoW146QF0qKSg/OjooW146QF0qKSk/KT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pL1xuICAgIH1cbiAgfVxuXG4gIHZhciBtID0gby5wYXJzZXJbb3B0cy5zdHJpY3RNb2RlID8gJ3N0cmljdCcgOiAnbG9vc2UnXS5leGVjKHN0cilcbiAgdmFyIHVyaSA9IHt9XG4gIHZhciBpID0gMTRcblxuICB3aGlsZSAoaS0tKSB1cmlbby5rZXlbaV1dID0gbVtpXSB8fCAnJ1xuXG4gIHVyaVtvLnEubmFtZV0gPSB7fVxuICB1cmlbby5rZXlbMTJdXS5yZXBsYWNlKG8ucS5wYXJzZXIsIGZ1bmN0aW9uICgkMCwgJDEsICQyKSB7XG4gICAgaWYgKCQxKSB1cmlbby5xLm5hbWVdWyQxXSA9ICQyXG4gIH0pXG5cbiAgcmV0dXJuIHVyaVxufVxuIl19
