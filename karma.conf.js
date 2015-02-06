module.exports = function(config) {
	config.set({
		basePath: 'src',
		files: [
			'../vendor/classyjs/build/classy.js',
			'SomeFile.js'
		],
		frameworks: ['jasmine'],
		browsers: ['PhantomJS']
	});
};
