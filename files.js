routerFiles = {
    src: [
        'src/qorlate.js'
    ],
    testUtils: [],
    test: [
        'specs/*Spec.js'
    ],
    angular: function() {
        return [
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js'
        ];
    }
};

if (exports) {
    exports.files = routerFiles;
}