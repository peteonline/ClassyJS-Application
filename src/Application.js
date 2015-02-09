define(

'class Classy.Application',
{
	
	'protected injector (Classy.Injector)': null,
	'protected dispatchable (Classy.Application.IDispatchable)': null,
	'protected errorHandler (Classy.Application.IErrorHandler)': null,
	'protected bootstraps ([Classy.Application.IBootstrap])': [],
	
	'public construct (Classy.Injector, Classy.Application.IDispatchable, Classy.Application.IErrorHandler?) -> undefined': function(injector, dispatchable, errorHandler)
	{
		this.injector(injector);
		this.dispatchable(dispatchable);
		if (errorHandler) this.errorHandler(errorHandler);
		injector.registerSingleton(this);
	},
	
	'public bootstrap (Classy.Application.IBootstrap) -> Classy.Application': function(bootstrap)
	{
		this.bootstraps('push', bootstrap);
		return this;
	},
	
	'public bootstrap ([Classy.Application.IBootstrap]) -> Classy.Application': function(bootstraps)
	{
		for (var i = 0; i < bootstraps.length; i++) this.bootstrap(bootstraps[i]);
		return this;
	},
	
	'public run () -> Classy.Application': function()
	{
		var bootstraps = this.getOrderedBootstraps();
		try {
			for (var i = 0; i < bootstraps.length; i++) bootstraps[i].bootstrap(this.injector());
			this.injector().resolve(this.dispatchable(), 'dispatch');
		} catch (error) {
			if (this.errorHandler() !== null) {
				this.errorHandler().handleError(error, this.injector());
			} else {
				throw error;
			}
		}
		return this;
	},
	
	'protected getOrderedBootstraps () -> [Classy.Application.IBootstrap]': function()
	{
		var bootstraps = this.bootstraps();
		if (bootstraps.length == 0) return [];
		var edges = [];
		var startNodes = [];
		for (var i = 0; i < bootstraps.length; i++) {
			var dependencies = bootstraps[i].getDependencyBootstraps();
			if (!dependencies || !dependencies.length) {
				startNodes.push(bootstraps[i]);
				continue;
			}
			for (var j = 0; j < dependencies.length; j++) {
				var dependencyObjects = this.getBootstrapInstances(dependencies[j]);
				for (var k = 0; k < dependencyObjects.length; k++) {
					edges.push({
						from: dependencyObjects[k],
						to:   bootstraps[i]
					});
				}
			}
		}
		var cyclicError = new Error('Provided bootstraps form a cyclic dependency chain');
		if (startNodes.length == 0) throw cyclicError;
		// The following is from this page on Wikipedia...
		// http://en.wikipedia.org/wiki/Topological_sorting
		var orderedBootstraps = [];
		while (startNodes.length > 0) {
			var startNode = startNodes.pop();
			orderedBootstraps.push(startNode);
			toInspectConnections:
			for (var i = edges.length; i-- > 0; ) {
				if (edges[i].from !== startNode) continue;
				var edge = edges.splice(i, 1)[0];
				for (var j = 0; j < edges.length; j++) {
					if (edges[j].to === edge.to) continue toInspectConnections;
				}
				startNodes.push(edge.to);
			}
		}
		if (edges.length > 0) throw cyclicError;
		return orderedBootstraps;
	},
	
	'protected getBootstrapInstances (string) -> [Classy.Application.IBootstrap]': function(className)
	{
		var matches = [];
		var bootstraps = this.bootstraps();
		for (var i = 0; i < bootstraps.length; i++) {
			// @todo When it is available, this
			// should use the Reflection API
			// instead of toString parsing
			var classNameMatch = bootstraps[i].toString().match(/\[object ([A-Za-z0-9.]+)\]/)[1];
			if (classNameMatch == className) matches.push(bootstraps[i]);
		}
		return matches;
	}
	
});
