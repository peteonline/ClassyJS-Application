describe('Classy.Application', function(){
	
	var mInjector;
	var mDispatchable;
	var mErrorHandler;
	var mBootstrap1;
	var mBootstrap2;
	var mBootstrap3;
	var application;
	
	var mocker = new ClassyJS.Mocker(
		new ClassyJS.NamespaceManager(),
		new ClassyJS.Mocker.ReflectionClassFactory()
	);
	
	define('class Dispatchable implements Classy.Application.IDispatchable', {
		'public dispatch (Classy.Injector) -> undefined': function(){}
	});
	
	define('class ErrorHandler implements Classy.Application.IErrorHandler', {
		'public handleError (Error, Classy.Injector) -> undefined': function(){}
	});
	
	define('class Bootstrap1 implements Classy.Application.IBootstrap', {
		'public bootstrap (Classy.Injector) -> undefined': function(){},
		'public getDependencyBootstraps () -> [string]': function(){}
	});
	
	define('class Bootstrap2 implements Classy.Application.IBootstrap', {
		'public bootstrap (Classy.Injector) -> undefined': function(){},
		'public getDependencyBootstraps () -> [string]': function(){}
	});
	
	define('class Bootstrap3 implements Classy.Application.IBootstrap', {
		'public bootstrap (Classy.Injector) -> undefined': function(){},
		'public getDependencyBootstraps () -> [string]': function(){}
	});
	
	beforeEach(function(){
		mInjector = mocker.getMock('Classy.Injector');
		mDispatchable = mocker.getMock('Dispatchable');
		mErrorHandler = mocker.getMock('ErrorHandler');
		mBootstrap1 = mocker.getMock('Bootstrap1');
		mBootstrap2 = mocker.getMock('Bootstrap2');
		mBootstrap3 = mocker.getMock('Bootstrap3');
		application = new Classy.Application(mInjector, mDispatchable);
	});
	
	it('runs provided dispatchable via injector', function(){
		spyOn(mInjector, 'resolve');
		application.run();
		expect(mInjector.resolve).toHaveBeenCalledWith(mDispatchable, 'dispatch');
	});
	
	it('runs single bootstrap before dispatchable', function(){
		var dispatchableCalled = false;
		spyOn(mBootstrap1, 'bootstrap').and.callFake(function(){
			expect(dispatchableCalled).toBe(false);
		});
		spyOn(mInjector, 'resolve').and.callFake(function(){
			dispatchableCalled = true;
		});
		application.bootstrap(mBootstrap1);
		application.run();
		expect(dispatchableCalled).toBe(true);
		expect(mBootstrap1.bootstrap).toHaveBeenCalled();
	});
	
	it('provides injector to single bootstrap', function(){
		spyOn(mBootstrap1, 'bootstrap');
		application.bootstrap(mBootstrap1);
		application.run();
		expect(mBootstrap1.bootstrap).toHaveBeenCalledWith(mInjector);
	});
	
	it('runs multiple bootstraps before dispatchable', function(){
		var dispatchableCalled = false;
		var bootstrapFake = function(){
			expect(dispatchableCalled).toBe(false);
		};
		spyOn(mBootstrap1, 'bootstrap').and.callFake(bootstrapFake);
		spyOn(mBootstrap2, 'bootstrap').and.callFake(bootstrapFake);
		spyOn(mBootstrap3, 'bootstrap').and.callFake(bootstrapFake);
		spyOn(mInjector, 'resolve').and.callFake(function(){
			dispatchableCalled = true;
		});
		application.bootstrap([mBootstrap1, mBootstrap2]);
		application.bootstrap(mBootstrap3);
		application.run();
		expect(dispatchableCalled).toBe(true);
		expect(mBootstrap1.bootstrap).toHaveBeenCalled();
		expect(mBootstrap2.bootstrap).toHaveBeenCalled();
		expect(mBootstrap3.bootstrap).toHaveBeenCalled();
	});
	
	it('provides injector to multiple bootstraps', function(){
		spyOn(mBootstrap1, 'bootstrap');
		spyOn(mBootstrap2, 'bootstrap');
		spyOn(mBootstrap3, 'bootstrap');
		application.bootstrap(mBootstrap1);
		application.bootstrap([mBootstrap2, mBootstrap3]);
		application.run();
		expect(mBootstrap1.bootstrap).toHaveBeenCalledWith(mInjector);
		expect(mBootstrap2.bootstrap).toHaveBeenCalledWith(mInjector);
		expect(mBootstrap3.bootstrap).toHaveBeenCalledWith(mInjector);
	});
	
	it('runs bootstraps in order implied by asking for dependencies', function(){
		var bootstrapCalls = [];
		spyOn(mBootstrap1, 'getDependencyBootstraps').and.callFake(function(){
			return ['Bootstrap2', 'Bootstrap3'];
		});
		spyOn(mBootstrap2, 'getDependencyBootstraps').and.callFake(function(){
			return ['Bootstrap3'];
		});
		spyOn(mBootstrap3, 'getDependencyBootstraps').and.callFake(function(){
			return [];
		});
		spyOn(mBootstrap1, 'bootstrap').and.callFake(function(){
			bootstrapCalls.push(1);
		});
		spyOn(mBootstrap2, 'bootstrap').and.callFake(function(){
			bootstrapCalls.push(2);
		});
		spyOn(mBootstrap3, 'bootstrap').and.callFake(function(){
			bootstrapCalls.push(3);
		});
		application.bootstrap([mBootstrap1, mBootstrap2, mBootstrap3]);
		application.run();
		expect(bootstrapCalls).toEqual([3, 2, 1]);
	});
	
	it('throws error if there is no bootstrap with no dependency', function(){
		var expectedError = new Error('Provided bootstraps form a cyclic dependency chain');
		spyOn(mBootstrap1, 'getDependencyBootstraps').and.callFake(function(){
			return ['Bootstrap2'];
		});
		spyOn(mBootstrap2, 'getDependencyBootstraps').and.callFake(function(){
			return ['Bootstrap3'];
		});
		spyOn(mBootstrap3, 'getDependencyBootstraps').and.callFake(function(){
			return ['Bootstrap1'];
		});
		application.bootstrap([mBootstrap1, mBootstrap2, mBootstrap3]);
		expect(function(){
			application.run();
		}).toThrow(expectedError);
	});
	
	it('throws error if some bootstraps form a cyclic dependency', function(){
		var expectedError = new Error('Provided bootstraps form a cyclic dependency chain');
		spyOn(mBootstrap1, 'getDependencyBootstraps').and.callFake(function(){
			return [];
		});
		spyOn(mBootstrap2, 'getDependencyBootstraps').and.callFake(function(){
			return ['Bootstrap3'];
		});
		spyOn(mBootstrap3, 'getDependencyBootstraps').and.callFake(function(){
			return ['Bootstrap2'];
		});
		application.bootstrap([mBootstrap1, mBootstrap2, mBootstrap3]);
		expect(function(){
			application.run();
		}).toThrow(expectedError);
	});
	
	it('passes bootstrap error to handler if present', function(){
		var error = new Error('Message');
		var application = new Classy.Application(mInjector, mDispatchable, mErrorHandler);
		spyOn(mErrorHandler, 'handleError');
		spyOn(mBootstrap1, 'bootstrap').and.throwError(error);
		application.bootstrap(mBootstrap1);
		application.run();
		expect(mErrorHandler.handleError).toHaveBeenCalledWith(error, mInjector);
	});
	
	it('passes dispatchable error to handler if present', function(){
		var error = new Error('Message');
		var application = new Classy.Application(mInjector, mDispatchable, mErrorHandler);
		spyOn(mErrorHandler, 'handleError');
		spyOn(mInjector, 'resolve').and.throwError(error);
		application.run();
		expect(mErrorHandler.handleError).toHaveBeenCalledWith(error, mInjector);
	});
	
	it('registers itself as an injector singleton', function(){
		var singleton;
		spyOn(mInjector, 'registerSingleton').and.callFake(function(instance){
			singleton = instance;
		});
		var application = new Classy.Application(mInjector, mDispatchable);
		expect(mInjector.registerSingleton).toHaveBeenCalled();
		expect(singleton).toBe(application);
	});
	
});
