/**
 * Correlated promises for AngularJS
 * @version v0.0.2-dev-2015-01-20
 * @link 
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

(function (window, angular) {
/* global angular */
'use strict';

(function (qlate) {

    function getByValOrFn(ref) {
        return angular.isFunction(ref) ? ref() : ref;
    }

    function IdProvider() { }

    angular.extend(IdProvider.prototype, {
        id: 1,
        getId: function () {
            var result = this.id;
            this.id += 1;
            return result;
        }
    });

    function QorlateProvider() { }

    angular.extend(QorlateProvider.prototype, {
        provider: new IdProvider(),
        timeout: 5000,
        correlations: {},
        setDefaultTime: function (timeout) {
            this.timeout = timeout;
        },
        setProvider: function (provider) {
            this.provider = provider;
        },
        $get: ['$q', '$timeout', function ($q, $timeout) {

            var _this = this,
                subscriptionProvider = new IdProvider(); // internal only

            function QorlateFn(config) {

                var defer = $q.defer(),
                    correlationId, // id to match back to the service
                    timeout, // amount of time in milliseconds to reject the correlation
                    timer = null, // timer reference to cancel the timeout
                    configuredId = null,
                    subscriptionId = null,
                    subscription = null,
                    correlation = null;

                // use default provider unless it is passed in
                if (config && config.id) {
                    correlationId = getByValOrFn(config.id);
                } else {
                    correlationId = _this.provider.getId();
                }

                // special logic for subscriptions
                if (config && config.subscribe) {
                    configuredId = config.id || getByValOrFn(config.subscribe);

                    if (configuredId !== !!configuredId) {

                        subscriptionId = configuredId + ':' + subscriptionProvider.getId();

                        subscription = {
                            id: subscriptionId
                        };

                        correlation = {
                            resolveFn: angular.noop,
                            rejectFn: angular.noop
                        };

                        subscription.always = function (resolveFn, rejectFn) {
                            correlation.resolveFn = resolveFn;
                            correlation.rejectFn = rejectFn;
                            return function () {
                                if (_this.correlations[configuredId] &&
                                _this.correlations[configuredId][subscriptionId]) {
                                    var correlation = _this.correlations[configuredId][subscriptionId];
                                    correlation.resolveFn = angular.noop;
                                    correlation.rejectFn = angular.noop;
                                    delete _this.correlations[configuredId][subscriptionId];
                                }
                            }
                        };

                        if (!_this.correlations[configuredId]) {
                            _this.correlations[configuredId] = [];
                        }

                        _this.correlations[configuredId].push({
                           subscriptionId: subscriptionId
                        });

                        _this.correlations[configuredId][subscriptionId] = correlation;

                        return subscription;
                    }
                    else {
                        throw new Error('Subscription id is required.');
                    }
                }

                // use default timeout unless it is passed in
                if (config && Object.prototype.hasOwnProperty.call(config, "timeout")) {
                    timeout = getByValOrFn(config.timeout);
                } else {
                    timeout = getByValOrFn(_this.timeout);
                }

                // 0+ means cancel after time (0 would be cancel immediate)
                if (timeout && timeout >= 0) {
                    timer = $timeout(function () {
                        defer.rejected = true;
                        defer.reject({
                            message: 'Qorlate request Timed out.',
                            id: correlationId
                        });
                    }, timeout);
                }

                if (!_this.correlations[correlationId]) {
                    _this.correlations[correlationId] = [];
                }

                // cache the correlation
                _this.correlations[correlationId].push({
                    defer: defer,
                    timer: timer,
                    timeout: timeout
                });

                // return the correlation and promise
                return {
                    id: correlationId,
                    promise: defer.promise
                };
            }

            Object.defineProperty(QorlateFn, "defaultTimeout", {
                configurable: false,
                enumerable: true,
                get: function() {
                    return getByValOrFn(_this.timeout);
                }
            });

            // option to immediately invoke the promise
            QorlateFn.immediate = function (data, failed) {
                var defer = $q.defer();
                if (failed) {
                    defer.reject(data);
                } else {
                    defer.resolve(data);
                }
                return defer.promise;
            };

            // Option to "resolve" a correlation - pass in the correlation id,
            // option data, and whether it failed
            QorlateFn.correlate = function (id, data, failed) {
                var exists = false, correlation, subscriptions = [], subscription;
                while (_this.correlations[id] && _this.correlations[id].length) {

                    correlation = _this.correlations[id].pop();

                    // special case for subscriptions
                    if (correlation.subscriptionId) {
                        if (_this.correlations[id][correlation.subscriptionId]) {
                            exists = true; // correlation existed
                            subscriptions.push(correlation.subscriptionId);
                            subscription = _this.correlations[id][correlation.subscriptionId];
                            if (failed) {
                                subscription.rejectFn(data);
                            }
                            else {
                                subscription.resolveFn(data);
                            }
                        }
                        continue;
                    }

                    if (correlation.timer) {
                        $timeout.cancel(correlation.timer);
                    }

                    if (correlation.defer.rejected) {
                        continue;
                    }

                    exists = true; // correlation existed

                    if (failed) {
                        correlation.defer.reject(data);
                    } else {
                        correlation.defer.resolve(data);
                    }
                }

                if (subscriptions.length === 0) {
                    delete _this.correlations[id];
                } else {
                    while (subscriptions.length) {
                        _this.correlations[id].push({
                            subscriptionId: subscriptions.pop()
                        });
                    }
                }

                return exists; // correlation did or did not exist
            };

            QorlateFn.reject = function(id, data) {
                return this.correlate(id, data, true);
            };

            QorlateFn.resolve = function(id, data) {
                return this.correlate(id, data, false);
            };

            return QorlateFn;
        }]
    });

    qlate.provider('qorlate', QorlateProvider);

})(angular.module('jlikness.qorlate', []));
})(window, window.angular);