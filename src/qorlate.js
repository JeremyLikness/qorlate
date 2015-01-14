/* global angular */
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

            var _this = this;

            function QorlateFn(config) {

                var defer = $q.defer(),
                    correlationId, // id to match back to the service
                    timeout, // amount of time in milliseconds to reject the correlation
                    timer = null; // timer reference to cancel the timeout

                // use default provider unless it is passed in
                if (config && config.id) {
                    correlationId = getByValOrFn(config.id);
                } else {
                    correlationId = _this.provider.getId();
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
                var exists = false, correlation;
                while (_this.correlations[id] && _this.correlations[id].length) {

                    correlation = _this.correlations[id].pop();
                    exists = true; // correlation existed

                    if (correlation.timer) {
                        $timeout.cancel(correlation.timer);
                    }

                    if (correlation.defer.rejected) {
                        continue;
                    }

                    if (failed) {
                        correlation.defer.reject(data);
                    } else {
                        correlation.defer.resolve(data);
                    }

                }

                if (exists) {
                    delete _this.correlations[id];
                }

                return exists; // correlation did not exist
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
