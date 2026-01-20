# easy-cancelable-promise

![Image John Avatar](https://raw.githubusercontent.com/johnny-quesada-developer/global-hooks-example/main/public/avatar2.jpeg)

Hello and welcome to **easy-cancelable-promise**, a streamlined and efficient solution for managing asynchronous operations in JavaScript with the elegance of cancelable promises! 🌟

Asynchronous programming is a cornerstone of JavaScript development, and promises are its heartbeat. With **easy-cancelable-promise**, you elevate your coding experience by introducing the ability to cancel promises - a feature that adds a new layer of control and sophistication to your asynchronous logic.

Whether you're developing with vanilla **JavaScript**, **TypeScript**, or integrating with various JavaScript frameworks, **easy-cancelable-promise** offers you the tools to efficiently manage promise states like 'pending', 'resolved', 'rejected', or the unique 'canceled'. This library is not just about cancellation; it's about enhancing the way you handle asynchronous patterns in your applications.

Experience a new realm of possibility in promise handling with **easy-cancelable-promise**:

# What Does a CancelablePromise Look Like?

## Quick Start

Here's a simple example showing how to create and cancel a promise:

```ts
import CancelablePromise from 'easy-cancelable-promise';

// Create a cancelable timeout
const promise = new CancelablePromise((resolve, reject, { onCancel }) => {
  const timeoutId = setTimeout(() => resolve('Done!'), 5000);

  onCancel(() => {
    clearTimeout(timeoutId);
    console.log('Timeout cleared!');
  });
});

// Cancel after 1 second
setTimeout(() => promise.cancel('User canceled'), 1000);

promise
  .then((result) => console.log(result))
  .catch((error) => console.log('Canceled:', error));

console.log(promise.status); // 'pending'
// After 1 second: 'canceled'
```

A cancelable promise looks just like a native promise, and, like the native promise, you can use it with async/await or with callbacks like then and catch.

```ts
const result = new CancelablePromise(
  (resolve, reject, { onCancel, reportProgress, cancel }) => {
    // ...your asynchronous code
  },
);
```

The promise constructor receives an extra parameter with:

### **cancel: (reason?: unknown) => CancelablePromise<TResult>**

A method that allows you to cancel the promise from its inner scope.

### **onCancel: (callback: TCancelCallback) => Subscription**

A method that allows you to subscribe to the cancel event of the promise. This is especially useful when you need to perform a specific action when the promise is canceled, like aborting an HTTP request or closing a socket.

### **reportProgress: (percentage: number, metadata?: unknown) => void**

A method that allows you to report the progress of the promise. This is especially useful when you have an async operation that could take a long time and you want to report progress to the user.

Let's take a look at the code:

```ts
const result = new CancelablePromise(
  async (resolve, reject, { onCancel, reportProgress, cancel }) => {
    const abortController = new CancelableAbortController();

    const request = fetch(
      'https://jsonplaceholder.typicode.com/todos/',
      abortController,
    );

    const unsubscribe = onCancel(() => {
      abortController.abort();
    });

    const results = await request;

    // the async process is not cancellable anymore
    unsubscribe();

    const todosById = await results.json().then((data) => {
      const total = data.length;
      const progressPerItem = 100 / total;

      return data.reduce((accumulator, item) => {
        accumulator[item.id] = item;

        reportProgress(progressPerItem);

        return accumulator;
      }, {});
    });

    // if you need you can cancel the promises it self whenever you want
    // cancel();

    resolve(todosById);
  },
)
  .then((result) => {
    console.log(`%cReady!!!`, 'color: blue; font-weight: bold;', result);
  })
  .onProgress((progress) => {
    console.log(`%ccomplete: ${progress}%`, 'color: blue; font-weight: bold;');
  })
  // .cancel() // you can also cancel the promise whenever you want from outside the promise
  .catch((error) => {
    // in case of error
  });
```

The same promise handles its own cancellation policy and resource cleanup. This promise can also send feedback, like progress updates, throughout the entire hierarchy. You can have multiple subscriptions to the **onCancel** callback to implement different resource release strategies as your task progresses.

```ts
const result = new CancelablePromise(
  async (resolve, reject, { onCancel, reportProgress, cancel }) => {
    // set resources

    let unsubscribe = onCancel(() => {
      // if something needs to be cleaned up or released at this point
    });

    // do something and wait for it to finish

    unsubscribe();

    // do something else

    // if something needs to be cleaned up or released at this point
    // add a new onCancel listener
    unsubscribe = onCancel(() => {
      // ...
    });
  },
);
```

You can also add an onCancel listener from outside the promise body. The method for unsubscribing is similar to that used with the fetch **AbortController**

```ts
const abortController = new CancelableAbortController();

const result = new CancelablePromise((resolve, reject) => {
  // ... do something
})
  .onCancel((progress) => {}, abortController)
  .onProgress((progress) => {}, abortController);

// if you want to remove the callback listeners
abortController.abort();

// OR

// also removing specific listeners is super easy
const [_, unsubscribeProgress] = abortController.subscriptions;

unsubscribeProgress();
```

The AbortController is meant to be used just once, so after calling the abort method, all listeners will be removed (This is the native behavior of the **AbortController**)

# Don't wait any longer!

Unlock the full potential of promises in JavaScript with easy-cancelable-promise and revolutionize the way you approach asynchronous programming!

Don't just take our word for it; explore the capabilities yourself with detailed API documentation below. 🚀

For more information, see the documentation and examples below. You can also check out other libraries that implement cancelable promises, such as [easy-web-worker](https://www.npmjs.com/package/easy-web-worker) and [easy-threads-workers](https://www.npmjs.com/package/easy-threads-workers).

## CancelablePromise

A Promise that can be canceled. Has a `status` property ('pending', 'resolved', 'rejected', or 'canceled'), an `onCancel` method to register cancellation callbacks, and a `cancel` method.

### Examples:

```ts
const promise = new CancelablePromise((resolve, reject, utils) => {
  utils.cancel('canceled');
});

promise.catch((reason) => {
  console.log(reason); // 'canceled'
  console.log(promise.status); // 'canceled'
});
```

### Properties

- `status`: **TPromiseStatus** - Current promise status ('pending' | 'resolved' | 'rejected' | 'canceled')

### Methods

- `onCancel`: Subscribe to the cancel event
- `onProgress`: Subscribe to progress reports
- `cancel`: Cancel the promise

## defer

Creates a deferred promise with separate resolve/reject functions.

### Example

```ts
import { defer } from 'easy-cancelable-promise';

const { promise, resolve } = defer<string>();
promise.then((result) => console.log(result));

resolve('hello world');
// hello world
```

## toCancelablePromise

Converts a Promise, CancelablePromise, or value to a CancelablePromise.

```ts
import { toCancelablePromise } from 'easy-cancelable-promise';

const promise = Promise.resolve('hello');
const cancelable = toCancelablePromise(promise);
cancelable.cancel();
```

## groupAsCancelablePromise

Groups multiple promises into a single CancelablePromise with concurrency control.

**Config options:**

- `maxConcurrent`: Max concurrent execution (default: 8)
- `executeInOrder`: Execute sequentially (default: false)
- `beforeEachCallback`: Called before each execution
- `afterEachCallback`: Called after each success
- `onQueueEmptyCallback`: Called when all complete

```ts
import { groupAsCancelablePromise } from 'easy-cancelable-promise';

const group = groupAsCancelablePromise([promise1, promise2], {
  maxConcurrent: 2,
});
group.cancel(); // Cancels all pending
```

## Type Guards

- `isPromise(value)`: Checks if a value is a Promise
- `isCancelablePromise(value)`: Checks if a value is a CancelablePromise
- `isCancelableAbortSignal(signal)`: Checks if an AbortSignal is a CancelableAbortSignal

# Contributing

We welcome contributions to easy-cancelable-promise! If you have an idea for a new feature or improvement, please open an issue or submit a pull request.

# License

easy-cancelable-promise is released under the MIT License.
