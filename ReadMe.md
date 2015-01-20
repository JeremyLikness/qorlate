($Q)orlate
==================

Simple module for promise correlations, i.e. promises that are resolved outside of the initial request. This is useful
for things like handling asynchronous initialization of service caches and using message buses or queues with signalR.
It also provides an event aggregator (publisher/subscriber) model for persistent messages. It all uses $Q under the
covers.

[See and run the specifications](http://jeremylikness.github.io/qorlate/sample/tests.html)

##qorlateProvider
Use the `qorlateProvider` to change the default timeout and specify your own provider for correlation ids.

###`setDefaultTime(timeout)`
By default a correlation request will timeout after 5 seconds. To override this behavior, configure the provider to either 
pass the timeout in milliseconds, or a function that will return the timeout in millseconds. If you wish to disable the
automatic timeouts, simply set timeout to `null` or a negative value.

Example: `qorlateProvider.setDefaultTime(10000); // after 10 seconds`

Example: `qorlateProvider.setDefaultTime(function () { return 10; }); // after 5 milliseconds`

###`setProvider(provider)`
The internal id provider (`IdProvider`) simply generates integer sequences. If you wish to change this behavior, you can 
create your own provider that implements the `getId` method to return a correlation of your choice. 

    function DateProvider() {
      this.getId = function () { 
         return (new Date()).getTime();
      };
    }
    qorlateProvider.setProvider(new DateProvider());

##`qorlate([config])`
Call the `qorlate` service to create a correlated promise. Any subsequent calls with the same id will generate a new 
promise (so that it may timeout). However, a single resolution or rejection will be broadcast to all correlations.

The configuration may have the following parameters: 

`id`: the value you wish to use for the correlation, or a function to return the value. If this is not passed, the method
`getId` on the configured provider will be called.

`timeout`: the value you wish to set for the timeout of the correlation, or a function to return the value. If this is not
passed, then `qorlate.defaultTimeout` will be used. Set this to `null` or a negative number to prevent any timeout.

`subscribe`: when true or set to a value, indicates this is a subscription for a pub/sub model (i.e. the result will
fire multiple times). You may set the `id` and `subscribe` to `true` or you may set `subscribe` with the same rules
as `id` (i.e. value or function).

The function returns a `IQorlateCorrelation` result that contains: 

`id`: the correlation id, either generated or passed in by configuration 

`promise`: the resulting promise

Or, for a subscription, a 'IQorlateSubscription' result that contains:

`id`: the id of the subscription (the correlation id and a unique identifier)

`always`: a method to call with a success callback and an optional failure callback to fire whenever a message is
raised. The result of the call to `always` is a cancellation function you may call to unsubscribe.

Create a correlation with the default timeout: 

`var correlation = qorlate();`

Create a correlation that never times out: 

`var correlation = qorlate({timeout:null});` 

Create a correlation with a specific value: 

`var correlation = qorlate({id:'my-correlation'});`

Subscribe to a message, then cancel the subscription:

    var subscription = qorlate({subscribe:'event'});
    var cancel = subscription.always(function success() {}, function error() {});
    cancel();

Consume the promise returned by a correlation: 

    var correlation = qorlate();
    correlation.promise.then(function success(data) {}, function error(err) {});
    
###`qorlate.correlate(id, [data], [failed])`
Use this method to resolve or reject the correlation. All subscribers will be notified. For clarity and consistency, it
is recommended to use the `qorlate.reject` or `qorlate.resolve` methods instead.

`id`: the correlation id. Should match the id either passed or generated in a previous call to `qorlate`. 

`data`: optional data to resolve. In the case of a rejection, optional error information. 

`failed`: set to true for failure.

###`qorlate.resolve(id, [data])`
Use this method to resolve the correlation. Parameters are the same as `qorlate.correlate` with `failed` set to `false`.

###`qorlate.reject(id, [data])`
Use this method to reject the correlation. Parameters are the same as `qorlate.correlate` with `failed` set to `true`.

###`qorlate.immediate([data], [failed])` 
Use this method to generate a promise that is immediate resolved or rejected. It is useful in the scenario when the 
correlation is used to defer initialization of a component. For example, if your component is waiting for `list` to be
populated, you might write: 

    function getList() {
       if (this.list.length) { // list is populated
          return qorlate.immediate(this.list); // send and immediately reoslve the promise 
       } 
       else {
          return qorlate({id: 'myList'}).promise; // wait for the list to be initialized
       }
    }
    
##Examples and Specifications

To run the examples and specifications, visit: [the sample page](http://jeremylikness.github.io/qorlate/sample/).