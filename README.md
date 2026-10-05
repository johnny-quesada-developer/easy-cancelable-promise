# easy-cancelable-promise 🎯

<div align="center">

![Image John Avatar](https://raw.githubusercontent.com/johnny-quesada-developer/global-hooks-example/main/public/avatar2.jpeg)

</div>

<div align="center">

**The cancelable promise you didn't know you needed.** 🚀

_Promises you can actually control._ ✨

[![npm version](https://img.shields.io/npm/v/easy-cancelable-promise.svg)](https://www.npmjs.com/package/easy-cancelable-promise)
[![Downloads](https://img.shields.io/npm/dm/easy-cancelable-promise.svg)](https://www.npmjs.com/package/easy-cancelable-promise)
[![License](https://img.shields.io/npm/l/easy-cancelable-promise.svg)](https://github.com/johnny-quesada-developer/easy-cancelable-promise/blob/main/LICENSE)

[**Documentation**](https://johnny-quesada-developer.github.io/easy-cancelable-promise/) • [**Live examples**](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/) • [**API reference**](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/api-reference/) • [**GitHub**](https://github.com/johnny-quesada-developer/easy-cancelable-promise) • [**NPM**](https://www.npmjs.com/package/easy-cancelable-promise)

</div>

---

## 🎯 The Problem

You're fetching user data, but the user navigated away. Your fetch continues anyway. Memory leak. Wasted bandwidth. Potential race conditions.

**Native promises can't be canceled. Their status can't be tracked.** Once started, they run to completion. Always.

## 💡 The Solution

```ts
import { CancelablePromise } from 'easy-cancelable-promise';

const fetchUser = new CancelablePromise(
  async (resolve, reject, { onCancel }) => {
    const controller = new AbortController();

    onCancel(() => controller.abort());

    const user = await fetch('/api/user', { signal: controller.signal }).then(
      (res) => res.json(),
    );

    resolve(user);
  },
);

// User navigated? Just cancel it.
fetchUser.cancel('User navigated away');
```

**Clean. Simple.** The promise handles its own cleanup. Cancel from anywhere, anytime. 🎯

▶️ **See it run:** [Stop the work](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/stop-the-work/). The same task in a native promise and in a CancelablePromise, with the steps each one still runs after you press Stop.

---

## ▶️ See It Before You Read It

Three live examples run the real library in your browser, next to the same code written with native promises. Each one shows measured numbers.

| Example                                                                                                                                   | What you will see                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [Stop the work](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/stop-the-work/)                               | After Stop, the native promise runs every remaining step. The CancelablePromise runs none.      |
| [Progress through the promise](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/progress-through-the-promise/) | One promise is silent until the end. The other reports every step, also through `.then()`.      |
| [Cancel a group](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/cancel-a-group/)                             | One `cancel` stops the running tasks and the queue. A queue of native promises starts them all. |

---

## 📦 Installation

```bash
npm install easy-cancelable-promise
```

**Zero dependencies. TypeScript ready. Works everywhere.**

📚 **Start here:** [Getting started](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/getting-started/)

---

## 🚀 Why Developers Love This Library

### 🎓 **100% Promise Compatible**

```ts
// If you know this...
const native = new Promise((resolve, reject) => {
  // ...
});

// You know this!
const cancelable = new CancelablePromise((resolve, reject, { onCancel }) => {
  // ...
});
```

Works with `async/await`, `.then()`, `.catch()` - everything!

📚 **Docs:** [CancelablePromise](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/cancelable-promise/)

---

### 🎯 **Lifecycle Control**

```ts
const task = new CancelablePromise((resolve, reject, { onCancel }) => {
  const timer = setTimeout(() => resolve('Done!'), 5000);

  onCancel((reason) => {
    clearTimeout(timer);
    console.log('Cleaned up because:', reason);
  });
});

task.cancel('No longer needed'); // Cleanup happens automatically
```

Canceling tells everyone to stop waiting. `onCancel` is where the work itself is stopped.

▶️ **Live example:** [Stop the work](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/stop-the-work/) · 📚 **Docs:** [cancel and onCancel](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/cancel-and-oncancel/)

---

### ⚡ **Built-in Progress Tracking**

```ts
const download = new CancelablePromise(
  (resolve, reject, { reportProgress }) => {
    let received = 0;

    const timer = setInterval(() => {
      received += 25;

      // Report progress as you go
      reportProgress(received);

      if (received < 100) return;

      clearInterval(timer);
      resolve('Done!');
    }, 100);
  },
);

const result = await download.onProgress((percent) => {
  console.log(`${percent}% complete`); // 25%, 50%, 75%, 100%
});

console.log('Finished:', result);
```

The progress also reaches the promises chained with `.then()`.

▶️ **Live example:** [Progress through the promise](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/progress-through-the-promise/) · 📚 **Docs:** [Progress reporting](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/progress-reporting/)

---

### 🔍 **Status Tracking**

```ts
const task = new CancelablePromise((resolve) => setTimeout(resolve, 1000));

console.log(task.status); // 'pending'

await task;
console.log(task.status); // 'resolved'

const other = new CancelablePromise(() => {});

other.cancel();
console.log(other.status); // 'canceled'
```

Four statuses: `pending`, `resolved`, `rejected` and `canceled`. A cancellation is never confused with a failure.

📚 **Docs:** [Status](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/cancelable-promise/#status)

---

### 🔗 **Chains That Cancel Together**

```ts
const user = fetchUser(1); // a CancelablePromise
const name = user.then((value) => value.name);
const greeting = name.then((value) => `Hello ${value}`);

// Cancel any promise of the chain: the request is aborted
greeting.cancel('User navigated away');

console.log(user.status); // 'canceled'
```

`then`, `catch` and `finally` return a CancelablePromise. Canceling one cancels the promises it was created from, and the promises chained from a canceled promise are canceled too.

📚 **Docs:** [Chains](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/cancelable-promise/#chains)

---

### 🧰 **Utilities Included**

```ts
import {
  defer,
  groupAsCancelablePromise,
  toCancelablePromise,
  CancelablePromise,
} from 'easy-cancelable-promise';

// Defer - external promise control
const deferred = defer<User>();
button.onclick = () => deferred.resolve(userData);

// Group - batch with concurrency, one cancel for all
const batch = groupAsCancelablePromise(
  [() => fetchUser(1), () => fetchUser(2), () => fetchUser(3)],
  { maxConcurrent: 2 },
);

// Static methods - just like Promise, and cancelable
const all = CancelablePromise.all([promise1, promise2]);
const race = CancelablePromise.race([promise1, promise2]);

// Convert - a native promise, a value or a function
const cancelable = toCancelablePromise(fetch('/api/user'));
```

▶️ **Live example:** [Cancel a group](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/cancel-a-group/) · 📚 **Docs:** [defer](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/defer/) · [Static helpers](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/static-helpers/) · [Converting native promises](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/converting-native-promises/)

---

## 🌟 The API at a Glance

| Export                      | What it is                                                                      | Docs                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `CancelablePromise`         | A `Promise` with `status`, `cancel`, `onCancel`, `onProgress`, `reportProgress` | [CancelablePromise](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/cancelable-promise/)                  |
| `CancelablePromise.all`     | Also `allSettled`, `race`, `resolve`, `reject` and `canceled`                   | [Static helpers](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/static-helpers/)                         |
| `defer`                     | A promise with its `resolve`, `reject` and `cancel` outside the callback        | [defer](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/defer/)                                           |
| `groupAsCancelablePromise`  | Many tasks, a concurrency limit, one promise                                    | [Groups and concurrency](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/groups-and-concurrency/)         |
| `toCancelablePromise`       | Converts a promise, a value or a function                                       | [Converting native promises](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/converting-native-promises/) |
| `isCancelablePromise`       | Type guard for cancelable promises                                              | [Type guards](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/converting-native-promises/#type-guards)    |
| `isPromise`                 | Type guard for anything with a `then` method                                    | [Type guards](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/converting-native-promises/#type-guards)    |
| `CancelableAbortController` | An `AbortController` that tracks its subscriptions                              | [Abort signals](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/abort-signals/)                           |
| `isCancelableAbortSignal`   | Type guard for its signal                                                       | [Abort signals](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/abort-signals/)                           |

Every signature and every exported type: [API reference](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/api-reference/).

---

## 🎬 The Essentials

### Executor Utilities

The third parameter gives you superpowers:

```ts
new CancelablePromise(
  (
    resolve,
    reject,
    { cancel, onCancel, reportProgress, status, isCanceled, isPending },
  ) => {
    // ✅ cancel: Cancel from inside
    cancel('Internal cancellation');

    // ✅ onCancel: Subscribe to cancellation
    const cleanup = onCancel((reason) => {
      console.log('Canceled:', reason);
    });

    // ✅ reportProgress: Report progress
    reportProgress(50); // 50% complete

    // ✅ status: Get current status
    console.log(status()); // 'pending'

    // ✅ isCanceled: Check if canceled
    if (isCanceled()) return;

    // ✅ isPending: Check if still pending
    if (isPending()) {
      // Continue work
    }
  },
);
```

📚 **Docs:** [The callback](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/cancelable-promise/#the-callback)

---

### Cancel a Real Request

```ts
import { CancelablePromise } from 'easy-cancelable-promise';

const fetchUser = (id: number) =>
  new CancelablePromise<User>(async (resolve, reject, { onCancel }) => {
    const controller = new AbortController();

    onCancel(() => controller.abort());

    const response = await fetch(`/api/users/${id}`, {
      signal: controller.signal,
    });

    resolve(await response.json());
  });

const request = fetchUser(1);

// Cancel anytime
request.cancel('User navigated away');
```

The callback can be `async`. An error it throws rejects the promise.

📚 **Docs:** [Getting started](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/getting-started/)

---

### Tell a Cancellation From a Failure

```ts
try {
  const user = await request;
} catch (error) {
  if (request.status === 'canceled') return; // nobody needs it any more

  showError(error);
}
```

The promise you cancel never causes an unhandled rejection, even when nothing catches it.

📚 **Docs:** [A cancellation is not a failure](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/cancel-and-oncancel/#a-cancellation-is-not-a-failure)

---

### Deferred Promises

```ts
import { defer } from 'easy-cancelable-promise';

function waitForUserInput() {
  const deferred = defer<string>();

  submitButton.addEventListener('click', () => deferred.resolve(input.value));

  // Auto-cancel after 30 seconds
  setTimeout(() => deferred.cancel('Timeout'), 30000);

  return deferred.promise;
}

const userInput = await waitForUserInput();
```

📚 **Docs:** [defer and DeferredPromise](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/defer/)

---

### Groups With a Concurrency Limit

```ts
import { groupAsCancelablePromise } from 'easy-cancelable-promise';

const batch = groupAsCancelablePromise(
  items.map((item) => () => api.processAndSaveItem(item)),
  {
    // Only 5 at a time (default: 8)
    maxConcurrent: 5,

    // Called before each task, with its position
    beforeEachCallback: (index) => {
      updateStatus(`Processing item ${index + 1}/${items.length}`);
    },

    // Called after each success, with the result and the position
    afterEachCallback: (result, index) => {
      logSuccess(`Item ${index + 1} processed`);
    },
  },
);

batch.onProgress((percent) => {
  progressBar.style.width = `${percent}%`;
});

// The results keep the order of the tasks
const results = await batch;

// One call cancels the running tasks and the ones still in the queue
batch.cancel('Page unloading');
```

Good to know:

- If a task is rejected, the group is rejected with the same reason and no more tasks are started.
- `executeInOrder: true` starts each task only after the previous one finished.
- An empty list of tasks returns `null`.

▶️ **Live example:** [Cancel a group](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/cancel-a-group/) · 📚 **Docs:** [Groups and concurrency](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/groups-and-concurrency/)

---

### Convert What You Already Have

```ts
import {
  toCancelablePromise,
  isCancelablePromise,
} from 'easy-cancelable-promise';

const fromPromise = toCancelablePromise(Promise.resolve('hello'));
const fromValue = toCancelablePromise(42);
const fromFunction = toCancelablePromise(() => Promise.resolve(true));

console.log(isCancelablePromise(fromPromise)); // true
```

A wrapped native promise can be canceled, but its work cannot be stopped: the native promise has no way to stop. To stop the work, create the CancelablePromise where the work starts.

📚 **Docs:** [What a wrapper can stop](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/converting-native-promises/#what-a-wrapper-can-stop)

---

## 📚 Documentation

| I want to...                           | Go to                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create my first cancelable promise     | [Getting started](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/getting-started/)                                      |
| Understand the class and its status    | [CancelablePromise](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/cancelable-promise/)                                 |
| Cancel, clean up and pass a reason     | [cancel and onCancel](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/cancel-and-oncancel/)                              |
| Report and track progress              | [Progress reporting](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/progress-reporting/)                                |
| Resolve a promise from outside         | [defer and DeferredPromise](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/defer/)                                      |
| Use `all`, `allSettled` and `race`     | [Static helpers](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/static-helpers/)                                        |
| Wrap promises I already have           | [Converting native promises](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/converting-native-promises/)                |
| Limit concurrency and cancel a batch   | [Groups and concurrency](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/groups-and-concurrency/)                        |
| Remove listeners with a signal         | [Abort signals](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/abort-signals/)                                          |
| Know the types and the package entries | [TypeScript](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/typescript/)                                                |
| Test cancelable code                   | [Testing](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/testing/)                                                      |
| Fix something that does not work       | [Troubleshooting](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/troubleshooting/)                                      |
| Upgrade from version 2                 | [Platform and versions](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/platform-and-versions/#upgrading-from-version-2) |

---

## 🆕 Version 3

- Published as ES modules and CommonJS. Every entry of the package shares one class, so `instanceof` works between them.
- A group rejects when a task fails, keeps the order of its results, and passes the position of each task to its callbacks.
- A promise settles once: later calls to `resolve`, `reject` and `cancel` are ignored and the status does not change.
- An error thrown by the callback, also an `async` one, rejects the promise.
- The promises chained from a canceled promise are canceled too.

Everything that changed, and what to do about it: [Upgrading from version 2](https://johnny-quesada-developer.github.io/easy-cancelable-promise/docs/platform-and-versions/#upgrading-from-version-2).

---

## 🎓 Comparison with Other Solutions

| Feature                       | easy-cancelable-promise | Native Promise | bluebird | p-cancelable |
| ----------------------------- | ----------------------- | -------------- | -------- | ------------ |
| ✅ 100% Promise compatible    | ✅                      | ✅             | ✅       | ✅           |
| ✅ Cancelation                | ✅                      | ❌             | ✅       | ✅           |
| ✅ Progress tracking          | ✅                      | ❌             | ❌       | ❌           |
| ✅ Status property            | ✅                      | ❌             | ❌       | ❌           |
| ✅ Multiple cancel listeners  | ✅                      | ❌             | ❌       | ❌           |
| ✅ Dynamic cleanup strategies | ✅                      | ❌             | ❌       | ❌           |
| ✅ Concurrency control        | ✅                      | ❌             | ✅       | ❌           |
| ✅ TypeScript first           | ✅                      | ✅             | ⚠️       | ✅           |
| ✅ Zero dependencies          | ✅                      | ✅             | ❌       | ✅           |

The whole library is about 7 KB minified and 2 KB gzipped, and bundlers drop what you do not import.

---

## 🌐 Related Projects

- [easy-web-worker](https://www.npmjs.com/package/easy-web-worker) - Easy Web Workers with CancelablePromise support

---

## 📝 Contributing

We welcome contributions! If you have an idea for a new feature or improvement, please open an issue or submit a pull request.

```bash
yarn install
yarn test              # unit tests of the library and of the website
yarn dev               # the documentation site, against the built package
yarn prepare-packages  # everything: lint, types, tests, build, browser tests, links
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

### Built with ❤️ for developers who value control

**[📚 Documentation](https://johnny-quesada-developer.github.io/easy-cancelable-promise/)** • **[▶️ Live examples](https://johnny-quesada-developer.github.io/easy-cancelable-promise/examples/)** • **[⭐ Star on GitHub](https://github.com/johnny-quesada-developer/easy-cancelable-promise)** • **[📝 Report Issues](https://github.com/johnny-quesada-developer/easy-cancelable-promise/issues)** • **[📦 NPM Package](https://www.npmjs.com/package/easy-cancelable-promise)**

</div>
