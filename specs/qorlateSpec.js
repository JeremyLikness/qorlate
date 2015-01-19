'use strict';

describe('jlikness.qorlate', function () {

    function isPromise(candidate) {
        expect(typeof candidate.then).toBe('function');
        expect(typeof candidate.catch).toBe('function');
        expect(typeof candidate.finally).toBe('function');
    }

    describe('qorlateProvider', function () {

        it('should use the value set for default timeout', function () {

            module('jlikness.qorlate', function (qorlateProvider) {
                qorlateProvider.setDefaultTime(50);
            });

            inject(function (qorlate) {
                expect(qorlate.defaultTimeout).toBe(50);
            });
        });

        it('should use the function set for default timeout', function () {

            module('jlikness.qorlate', function (qorlateProvider) {
                qorlateProvider.setDefaultTime(function () {
                    return 100;
                });
            });

            inject(function (qorlate) {
                expect(qorlate.defaultTimeout).toBe(100);
            });
        });

        it('should use the id provider passed in', function () {

            var lastTime = null;

            function TimeProvider() {
            }

            angular.extend(TimeProvider.prototype, {
                getId: function () {
                    lastTime = (new Date()).getTime();
                    return lastTime;
                }
            });

            module('jlikness.qorlate', function (qorlateProvider) {
                qorlateProvider.setProvider(new TimeProvider());
            });

            inject(function (qorlate) {
                var correlation = qorlate({timeout: null});
                expect(correlation.id).toBe(lastTime);
            });
        });
    });

    describe('default id provider (IdProvider)', function () {

        it('should return unique sequential values', function () {

            module('jlikness.qorlate');

            inject(function (qorlate) {
                var last, current = null, iteration, correlation;
                for (iteration = 0; iteration < 1000; iteration+=1) {
                    correlation = qorlate({timeout:null});
                    last = current;
                    current = correlation.id;
                    if (last) {
                        expect(current).not.toBe(last);
                        expect(current).toBe(last + 1);
                    }
                }
            });
        });

    });

    describe('qorlate', function () {

        var $rs,
            $t,
            ql8,
            id = 'test',
            idFn = function () {
                return id;
            };

        beforeEach(function () {
            module('jlikness.qorlate');
        });

        beforeEach(inject(function ($rootScope, $timeout, qorlate) {
            $rs = $rootScope;
            $t = $timeout;
            ql8 = qorlate;
        }));

        it('should return a correlation result with a promise', function () {
            var correlation = ql8();
            expect(correlation).not.toBeNull();
            expect(correlation.id).not.toBeNull();
            expect(correlation.promise).not.toBeNull();
            isPromise(correlation.promise);
            $t.flush();
        });

        it('should return a unique correlation id with each call', function () {
            var correlation1 = ql8(),
                correlation2 = ql8();
            expect(correlation1.id).not.toBeNull();
            expect(correlation2.id).not.toBeNull();
            expect(correlation1.id).not.toBe(correlation2.id);
            $t.flush();
        });

        it('should use id passed in configuration', function () {
            var correlation = ql8({id: id});
            expect(correlation.id).toBe(id);
            $t.flush();
        });

        it('should use result of function for id passed in configuration', function () {
            var correlation = ql8({id: idFn});
            expect(correlation.id).toBe(id);
            $t.flush();
        });

        it('should provide a default timeout value of 5000', function () {
            expect(ql8.defaultTimeout).toBe(5000);
        });

        it('should reject the correlation if it is not resolved in the timeout period', function () {
            var resolved = false,
                rejected = false,
                correlation = ql8();

            correlation.promise.then(function success() {
                resolved = true;
            }, function error() {
                rejected = true;
            });

            $t.flush();

            expect(resolved).toBe(false);
            expect(rejected).toBe(true);
        });

        it('should use timeout passed in configuration', inject(function ($browser) {
            ql8({timeout: 50});
            expect($browser.deferredFns[0].time).toBe(50);
            $t.flush();
        }));

        it('should use result of function for timeout passed in configuration', inject(function ($browser) {
            ql8({
                timeout: function () {
                    return 100;
                }
            });
            expect($browser.deferredFns[0].time).toBe(100);
            $t.flush();
        }));

        it('should cancel the timeout if it is passed as null', inject(function ($browser) {
            ql8({timeout: null});
            expect($browser.deferredFns.length).toBe(0);
        }));

        it('should cancel the timeout if it is passed as a value less than zero', inject(function ($browser) {
            ql8({timeout: -1});
            expect($browser.deferredFns.length).toBe(0);
        }));

        describe('immediate', function () {

            it('should immediately return a promise.', function () {
                var promise = ql8.immediate();
                expect(promise).not.toBeNull();
                isPromise(promise);
            });

            it('should immediately resolve the promise', function () {
                var resolved = false,
                    rejected = false,
                    promise = ql8.immediate(id);
                promise.then(function (data) {
                    resolved = true;
                    expect(data).toBe(id);
                }, function () {
                    rejected = true;
                });

                $rs.$digest();

                expect(resolved).toBe(true);
                expect(rejected).toBe(false);
            });

            it('should immediately reject the promise', function () {
                var resolved = false,
                    rejected = false,
                    promise = ql8.immediate(id, true);

                promise.then(function (data) {
                    resolved = true;
                    expect(data).toBe(id);
                }, function () {
                    rejected = true;
                });

                $rs.$digest();

                expect(resolved).toBe(false);
                expect(rejected).toBe(true);
            });
        });

        describe('correlate', function () {

            it('should resolve the promise', function () {

                var resolved = false,
                    rejected = false,
                    correlation = ql8({timeout: null}),
                    promise = correlation.promise,
                    data = null;

                promise.then(function (success) {
                    data = success;
                    resolved = true;
                }, function (err) {
                    data = err;
                    rejected = true;
                });

                ql8.correlate(correlation.id, "test");

                $rs.$digest();

                expect(rejected).toBe(false);
                expect(resolved).toBe(true);
                expect(data).toBe("test");
            });

            it('should resolve the promise when failed passed as false', function () {

                var resolved = false,
                    rejected = false,
                    correlation = ql8({timeout: null}),
                    promise = correlation.promise,
                    data = null;

                promise.then(function (success) {
                    data = success;
                    resolved = true;
                }, function (err) {
                    data = err;
                    rejected = true;
                });

                ql8.correlate(correlation.id, "test", false);

                $rs.$digest();

                expect(rejected).toBe(false);
                expect(resolved).toBe(true);
                expect(data).toBe("test");
            });

            it('should reject the promise when failed passed as true', function () {

                var resolved = false,
                    rejected = false,
                    correlation = ql8({timeout: null}),
                    promise = correlation.promise;

                promise.then(function success() {
                    resolved = true;
                }, function error() {
                    rejected = true;
                });

                ql8.correlate(correlation.id, "test", true);

                $rs.$digest();

                expect(rejected).toBe(true);
                expect(resolved).toBe(false);
            });

            it('should handle multiple promises', function () {

                var resolved1 = false,
                    rejected1 = false,
                    resolved2 = false,
                    rejected2 = false,
                    correlation1 = ql8({id: 'myTest', timeout: null}),
                    correlation2 = ql8({id: 'myTest', timeout: null}),
                    promise1 = correlation1.promise,
                    promise2 = correlation2.promise;

                promise1.then(function success() {
                    resolved1 = true;
                }, function error() {
                    rejected1 = true;
                });

                promise2.then(function success() {
                    resolved2 = true;
                }, function error() {
                    rejected2 = true;
                });

                ql8.correlate('myTest');

                $rs.$digest();

                expect(resolved1).toBe(true);
                expect(rejected1).toBe(false);
                expect(resolved2).toBe(true);
                expect(rejected2).toBe(false);
            });

        });

        describe('resolved', function () {

            it('should resolve the promise', function () {

                var resolved = false,
                    rejected = false,
                    correlation = ql8({timeout: null}),
                    promise = correlation.promise,
                    data = null;

                promise.then(function (success) {
                    data = success;
                    resolved = true;
                }, function (err) {
                    data = err;
                    rejected = true;
                });

                ql8.resolve(correlation.id, "test");

                $rs.$digest();

                expect(rejected).toBe(false);
                expect(resolved).toBe(true);
                expect(data).toBe("test");
            });

            it('should handle multiple promises', function () {

                var resolved1 = false,
                    rejected1 = false,
                    resolved2 = false,
                    rejected2 = false,
                    correlation1 = ql8({id: 'myTest', timeout: null}),
                    correlation2 = ql8({id: 'myTest', timeout: null}),
                    promise1 = correlation1.promise,
                    promise2 = correlation2.promise;

                promise1.then(function success() {
                    resolved1 = true;
                }, function error() {
                    rejected1 = true;
                });

                promise2.then(function success() {
                    resolved2 = true;
                }, function error() {
                    rejected2 = true;
                });

                ql8.resolve('myTest');

                $rs.$digest();

                expect(resolved1).toBe(true);
                expect(rejected1).toBe(false);
                expect(resolved2).toBe(true);
                expect(rejected2).toBe(false);
            });

        });

        describe('reject', function () {

            it('should reject the promise', function () {

                var resolved = false,
                    rejected = false,
                    correlation = ql8({timeout: null}),
                    promise = correlation.promise,
                    data = null;

                promise.then(function success(payload) {
                    data = payload;
                    resolved = true;
                }, function error(err) {
                    data = err;
                    rejected = true;
                });

                ql8.reject(correlation.id, "error");

                $rs.$digest();

                expect(rejected).toBe(true);
                expect(resolved).toBe(false);
                expect(data).toBe("error");
            });

            it('should handle multiple promises', function () {

                var resolved1 = false,
                    rejected1 = false,
                    resolved2 = false,
                    rejected2 = false,
                    correlation1 = ql8({id: 'myTest', timeout: null}),
                    correlation2 = ql8({id: 'myTest', timeout: null}),
                    promise1 = correlation1.promise,
                    promise2 = correlation2.promise;

                promise1.then(function success() {
                    resolved1 = true;
                }, function error() {
                    rejected1 = true;
                });

                promise2.then(function success() {
                    resolved2 = true;
                }, function error() {
                    rejected2 = true;
                });

                ql8.reject('myTest');

                $rs.$digest();

                expect(resolved1).toBe(false);
                expect(rejected1).toBe(true);
                expect(resolved2).toBe(false);
                expect(rejected2).toBe(true);
            });

        });
    });
});
