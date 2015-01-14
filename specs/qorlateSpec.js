'use strict';

describe('qorlate', function () {

    function isPromise(candidate) {
        expect(typeof candidate.then).toBe('function');
        expect(typeof candidate.catch).toBe('function');
        expect(typeof candidate.finally).toBe('function');
    }

    var $rs,
        $t,
        ql8,
        id = 'test',
        idFn = function () { return id; };

    beforeEach(function () {
        module('jlikness.qorlate');
    });

    beforeEach(inject(function($rootScope, $timeout, qorlate) {
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
        var correlation1 = ql8(), correlation2 = ql8();
        expect(correlation1.id).not.toBeNull();
        expect(correlation2.id).not.toBeNull();
        expect(correlation1.id).not.toBe(correlation2.id);
        $t.flush();
    });

    it('should use id passed in configuration', function () {
        var correlation = ql8({ id: id });
        expect(correlation.id).toBe(id);
        $t.flush();
    });

    it('should use result of function for id passed in configuration', function () {
        var correlation = ql8({ id: idFn });
        expect(correlation.id).toBe(id);
        $t.flush();
    });

    it('should provide a default timeout value of 5000', function () {
        expect(ql8.defaultTimeout).toBe(5000);
    });

    it('should reject the correlation if it is not resolved in the timeout period', function () {
        var done = false, resolved = false, rejected = false, correlation = ql8();

        correlation.promise.then(function success () {
            resolved = true;
        }, function error () {
            rejected = true;
        });

        $t.flush();

        expect(resolved).toBe(false);
        expect(rejected).toBe(true);
    });

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

    it('should use timeout passed in configuration', function () {

    });

    it('should use result of function for timeout passed in configuration', function () {

    });

    it('should cancel the timeout if it is passed as null', function () {

    });

    it('should cancel the timeout if it is passed as a value less than zero', function () {

    });
});