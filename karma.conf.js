module.exports = function(config) {
	config.set({
		basePath: 'src',
		files: [
			'../vendor/classyjs/build/classy.js',
			'../vendor/classyjs-injector/build/injector.js',
			'Application.js',
			'ApplicationTest.js',
			'Application/IBootstrap.js',
			'Application/IDispatchable.js',
			'Application/IErrorHandler.js'
		],
		frameworks: ['jasmine'],
		browsers: ['PhantomJS']
	});
};
