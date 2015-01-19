// Type definitions for Angular JS 1.1.5+ (jlikness.qorlate module)
// Project: https://github.com/jeremylikness/qorlate

declare module jlikness {

    interface IQorlatePromise {
        then<TResult>(successCallback: (promiseValue: any) => TResult,
                      errorCallback?: (reason: any) => any,
                      notifyCallback?: (state: any) => any) : IQorlatePromise<TResult>;
        finally(finallyCallback: () => any): IQorlatePromise;
        catch<TResult>(onRejected: (reason: any) => TResult): IQorlatePromise;
    }

    interface IQorlateCorrelation {
        id: any;
        promise: IQorlatePromise
    }

    interface IQorlateConfiguration {
        id?: any;
        timeout?: any;
    }

    interface IQorlate {
        (config?: IQorlateConfiguration): IQorlateCorrelation;
        defaultTimeout: number;
        immediate: (data?: any, failed?: boolean) => IQorlatePromise;
        correlate: (correlationId: any, data?: any, failed?: boolean) => boolean;
        resolve: (correlationId: any, data?: any) => boolean;
        reject: (correlationId: any, data?: any) => boolean;
    }

}