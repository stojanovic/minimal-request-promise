/*global module, require, global */
var https = require('https'),
	urlParser = require('url'),
	minimalRequestPromise = function (callOptions, PromiseImplementation) {
		'use strict';
		var Promise = PromiseImplementation || global.Promise;
		return new Promise(function (resolve, reject) {
			var req = https.request(callOptions);

			req.on('response', function (res) {
				var dataChunks = [];
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					dataChunks.push(chunk);
				});
				res.on('end', function () {
					var response = {
						headers: res.headers,
						body: dataChunks.join(''),
						statusCode: res.statusCode,
						statusMessage: res.statusMessage
					};
					if (callOptions.resolveErrors || (response.statusCode > 199 && response.statusCode < 400)) {
						resolve(response);
					} else {
						reject(response);
					}
				});
			}).on('error', function (e) {
				reject(e);
			});
			if (callOptions.body) {
				req.write(callOptions.body);
			}
			req.end();
		});
	},
	mergeObjects = function (target, properties) {
		'use strict';
		if (!properties) {
			return;
		}
		Object.keys(properties).forEach(function (key) {
			target[key] = properties[key];
		});
	},
	createMethodHelper = function (method) {
		'use strict';
		return function (url, additionalOptions, PromiseImplementation) {
			var Promise = PromiseImplementation || global.Promise;
			return Promise.resolve(url)
				.then(function (url) {
					return urlParser.parse(url);
				}).then(function (parsedUrl) {
					if (additionalOptions && additionalOptions.method && additionalOptions.method !== method)
						throw new Error('Method can\'t be overridden');
					var options = {};
					mergeObjects(options, parsedUrl);
					options.method = method;
					mergeObjects(options, additionalOptions);
					return minimalRequestPromise(options, Promise);
				});
		};
	};

module.exports = minimalRequestPromise;

module.exports.get = createMethodHelper('GET');
module.exports.post = createMethodHelper('POST');
