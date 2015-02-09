define(

'interface Classy.Application.IBootstrap',
[
	
	'public getDependencyBootstraps () -> [string]',
	'public bootstrap (Classy.Injector) -> undefined'
	
]);
