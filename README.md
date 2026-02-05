# easy-cancelable-promise 🎯

<div align="center">

![Image John Avatar](https://raw.githubusercontent.com/johnny-quesada-developer/global-hooks-example/main/public/avatar2.jpeg)

</div>

<div align="center">

**The cancelable promise you didn't know you needed.** 🚀

_Promises that respect boundaries. Cancel what you don't need._ ✨

[![npm version](https://img.shields.io/npm/v/easy-cancelable-promise.svg)](https://www.npmjs.com/package/easy-cancelable-promise)
[![Downloads](https://img.shields.io/npm/dm/easy-cancelable-promise.svg)](https://www.npmjs.com/package/easy-cancelable-promise)
[![License](https://img.shields.io/npm/l/easy-cancelable-promise.svg)](https://github.com/johnny-quesada-developer/easy-cancelable-promise/blob/main/LICENSE)

[**GitHub**](https://github.com/johnny-quesada-developer/easy-cancelable-promise) • [**NPM**](https://www.npmjs.com/package/easy-cancelable-promise)

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

    const user = await fetch('/api/user', controller).then((res) => res.json());

    resolve(user);
  },
);

// User navigated? Just cancel it.
fetchUser.cancel('User navigated away');
```

**Clean. Simple.** The promise handles its own cleanup. Cancel from anywhere, anytime. 🎯

---

## 🚀 Why Developers Love This Library

### 🎓 **100% Promise Compatible**

```ts
// If you know this...
const promise = new Promise((resolve, reject) => {
  // ...
});

// You know this!
const promise = new CancelablePromise((resolve, reject, { onCancel }) => {
  // ...
});
```

Works with `async/await`, `.then()`, `.catch()` - everything!

---

### ⚡ **Built-in Progress Tracking**

```ts
const download = new CancelablePromise(
  (resolve, reject, { reportProgress }) => {
    // Report progress as you go
    reportProgress(25);
    reportProgress(50);
    reportProgress(100);

    resolve('Done!');
  },
);

const result = await download.onProgress((percent) => {
  console.log(`${percent}% complete`);
});

console.log('Finished:', result);
```

---

### 🎯 **Lifecycle Control**

```ts
const task = new CancelablePromise((resolve, reject, { onCancel }) => {
  const resource = allocate();

  onCancel(() => {
    resource.cleanup();
    console.log('Cleaned up!');
  });

  // Do work...
});

task.cancel(); // Cleanup happens automatically
```

---

### 🔍 **Status Tracking**

```ts
console.log(promise.status); // 'pending'

await promise;
console.log(promise.status); // 'resolved'

promise.cancel();
console.log(promise.status); // 'canceled'
```

Track state throughout the entire lifecycle!

---

### 🎪 **Multiple Cleanup Strategies**

```ts
const download = new CancelablePromise(
  async (resolve, reject, { onCancel }) => {
    const controller = new AbortController();

    let cleanup = onCancel(() => controller.abort());

    const file = await fetch(url, { signal: controller.signal });

    // there is nothing to abort anymore, so we can remove the old listener
    cleanup();

    cleanup = onCancel(() => tempFile.delete());

    await saveFile(file);
  },
);
```

---

### 🔗 **Utilities Included**

```ts
import {
  defer,
  groupAsCancelablePromise,
  CancelablePromise,
} from 'easy-cancelable-promise';

// Defer - external promise control
const deferred = defer<User>();
button.onclick = () => deferred.resolve(userData);

// Group - batch with concurrency
const batch = groupAsCancelablePromise(
  [() => fetchUser(1), () => fetchUser(2), () => fetchUser(3)],
  { maxConcurrent: 2 },
);

// Static methods - just like Promise
const all = CancelablePromise.all([promise1, promise2]);
const race = CancelablePromise.race([promise1, promise2]);
```

---

## 📦 Installation

```bash
npm install easy-cancelable-promise
```

**Zero dependencies. TypeScript ready. Works everywhere.**

---

## 🎬 Quick Start

### The Basics

```ts
import { CancelablePromise } from 'easy-cancelable-promise';

const loadUserData = new CancelablePromise(
  async (resolve, reject, { onCancel }) => {
    const controller = new AbortController();
    onCancel(() => controller.abort());

    const data = await fetch('/api/user', { signal: controller.signal });
    resolve(await data.json());
  },
);

// Cancel anytime
loadUserData.cancel('User navigated away');
```

Works exactly like Promise, but with superpowers. ⚡

---

### Multi-Stage Operations with Cascading Cancellation

Cancel operations at different stages based on progress:

```ts
const processData = new CancelablePromise(
  async (resolve, reject, { onCancel }) => {
    // Stage 1: Fetch data from API
    const fetchData = api.fetch(requestId);

    onCancel(() => fetchData.cancel('Request canceled during fetch'));

    const data = await fetchData;

    // Stage 2: Transform and save
    const saveData = api.save(data);

    onCancel(() => saveData.cancel('Request canceled during save'));

    const result = await saveData;

    resolve(result);
  },
);

// User cancels during any stage? Proper cleanup happens automatically
cancelButton.onclick = () => processData.cancel('User canceled operation');
```

**Dynamic cleanup strategies that evolve with your operation.** 🎯

---

### Progress Tracking

```ts
const uploadFile = new CancelablePromise(
  (resolve, reject, { onCancel, reportProgress }) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      reportProgress((e.loaded / e.total) * 100);
    };

    onCancel(() => xhr.abort());

    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error('Upload failed'));

    xhr.open('POST', '/upload');
    xhr.send(fileData);
  },
);

uploadFile
  .onProgress((percent) => {
    progressBar.style.width = `${percent}%`;
  })
  .then(() => showSuccess())
  .catch(() => showError());

// Or with async/await
try {
  await uploadFile.onProgress((percent) => {
    progressBar.style.width = `${percent}%`;
  });

  showSuccess();
} catch (error) {
  showError();
}

// User clicks cancel
uploadFile.cancel();
```

**Built-in progress tracking. No extra libraries needed.** 📊

---

## 🌟 Core Features Deep Dive

### 1️⃣ CancelablePromise - The Foundation

The core class that extends native Promise with cancellation and lifecycle management.

#### 🎨 The Basics

```ts
import { CancelablePromise } from 'easy-cancelable-promise';

// Simple timeout
const timeout = new CancelablePromise((resolve) => {
  setTimeout(() => resolve('Done!'), 1000);
});

// With cancellation
const withCancel = new CancelablePromise((resolve, reject, { onCancel }) => {
  const id = setTimeout(() => resolve('Done!'), 5000);

  onCancel((reason) => {
    clearTimeout(id);
    console.log('Canceled because:', reason);
  });
});

withCancel.cancel('User navigated away');
```

#### 🎯 Executor Utilities

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

#### ⚡ Status Tracking

Track your promise through its entire lifecycle:

```ts
const promise = new CancelablePromise((resolve) => {
  setTimeout(() => resolve('Done!'), 1000);
});

console.log(promise.status); // 'pending'

promise.then(() => {
  console.log(promise.status); // 'resolved'
});

// Or if canceled
promise.cancel();
console.log(promise.status); // 'canceled'

// On error
promise.catch(() => {
  console.log(promise.status); // 'rejected'
});
```

**Status types:**

- `'pending'` - In progress
- `'resolved'` - Successfully completed
- `'rejected'` - Failed with error
- `'canceled'` - Canceled by user/system

#### 🎬 Lifecycle Hooks

Subscribe to cancellation from inside or outside:

```ts
// Inside the executor
const promise = new CancelablePromise((resolve, reject, { onCancel }) => {
  const socket = createSocket();

  onCancel(() => {
    socket.close();
    console.log('Socket closed');
  });

  socket.on('data', (data) => resolve(data));
});

// Outside the executor
promise.onCancel((reason) => {
  console.log('Canceled because:', reason);
  logToAnalytics('promise_canceled', { reason });
});
```

#### 🎨 Progress Tracking

Report and track progress throughout execution:

```ts
const task = new CancelablePromise((resolve, reject, { reportProgress }) => {
  const steps = 10;

  for (let i = 0; i < steps; i++) {
    doWork(i);
    reportProgress((i / steps) * 100);
  }

  resolve('Complete!');
});

// Track progress
task.onProgress((percent, metadata) => {
  updateProgressBar(percent);
  console.log(`${percent}% complete`, metadata);
});

// Chain progress tracking
task
  .onProgress((p) => console.log(`Progress: ${p}%`))
  .onProgress((p) => updateUI(p))
  .then((result) => console.log('Done!', result));
```

#### 🎪 Cancel from Anywhere

Cancel from inside the executor or outside:

```ts
const fetchWithTimeout = new CancelablePromise(
  async (resolve, reject, { cancel, onCancel }) => {
    const controller = new AbortController();

    onCancel(() => controller.abort());

    // control it's own timeout
    const timeoutId = setTimeout(() => {
      cancel('Request timeout');
    }, 5000);

    try {
      const response = await fetch('/api/data', { signal: controller.signal });
      clearTimeout(timeoutId);

      resolve(await response.json());
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  },
);

// Cancel from outside (internal timeout also cancels automatically)
cancelButton.onclick = () => {
  fetchWithTimeout.cancel('User canceled');
};

// Cancellation won't cause unhandled rejection, but you can catch it:
fetchWithTimeout.catch((error) => {
  console.log('Request failed or canceled:', error);
});
```

---

### 2️⃣ defer - Deferred Promises

Create promises with externalized resolve/reject control:

```ts
import { defer } from 'easy-cancelable-promise';

// Basic usage
const deferred = defer<string>();

deferred.promise.then((result) => {
  console.log('Result:', result);
});

// Resolve from anywhere
setTimeout(() => {
  deferred.resolve('Hello world!');
}, 1000);

// Or reject
deferred.reject(new Error('Something went wrong'));

// Or cancel
deferred.cancel('User canceled');
```

#### 🎯 Event-Based Resolution

```ts
function waitForUserInput() {
  const deferred = defer<string>();

  const button = document.getElementById('submit');
  const input = document.getElementById('input') as HTMLInputElement;

  button.addEventListener('click', () => {
    deferred.resolve(input.value);
  });

  // Auto-cancel after 30 seconds
  setTimeout(() => {
    deferred.cancel('Timeout');
  }, 30000);

  return deferred.promise;
}

const userInput = await waitForUserInput();
console.log('User entered:', userInput);
```

#### 🔄 Managing Long-Running Operations

```ts
class TaskManager {
  private currentTask: CancelablePromise<Result> | null = null;

  async executeTask(task: Task) {
    // Cancel previous task if running
    this.currentTask?.cancel('New task started');

    // Start new task
    this.currentTask = api.performTask(task);

    // Return new task promise
    return this.currentTask;
  }

  cancel() {
    this.currentTask?.cancel('User canceled');
  }
}
```

---

### 3️⃣ toCancelablePromise - Universal Converter

Convert anything to a CancelablePromise:

```ts
import { toCancelablePromise } from 'easy-cancelable-promise';

// From native Promise
const native = Promise.resolve('hello');
const cancelable = toCancelablePromise(native);
cancelable.cancel(); // Now cancelable!

// From value
const fromValue = toCancelablePromise(42);
console.log(await fromValue); // 42

// Already cancelable? Returns as-is
const alreadyCancelable = new CancelablePromise((resolve) => resolve('hi'));
const same = toCancelablePromise(alreadyCancelable);
console.log(same === alreadyCancelable); // true
```

---

### 4️⃣ groupAsCancelablePromise - Concurrency Control

Group multiple promises with advanced control over execution:

```ts
import { groupAsCancelablePromise } from 'easy-cancelable-promise';

const tasks = [
  () => fetchUser(1),
  () => fetchUser(2),
  () => fetchUser(3),
  () => fetchUser(4),
  () => fetchUser(5),
];

// Execute with concurrency limit
const group = groupAsCancelablePromise(tasks, {
  maxConcurrent: 2, // Only 2 at a time
});

group.onProgress((percent) => {
  console.log(`${percent}% complete`);
});

const results = await group;
console.log('All users:', results);

// Cancel all pending tasks
group.cancel('User navigated away');
```

#### 🎛️ Configuration Options

```ts
groupAsCancelablePromise(tasks, {
  // Max concurrent executions (default: 8)
  maxConcurrent: 3,

  // Execute in order (default: false)
  executeInOrder: true,

  // Called before each task
  beforeEachCallback: (index) => {
    console.log(`Starting task ${index}`);
  },

  // Called after each success
  afterEachCallback: (result, index) => {
    console.log(`Task ${index} completed:`, result);
  },

  // Called when queue is empty
  onQueueEmptyCallback: () => {
    console.log('All tasks complete!');
  },
});
```

#### 🎯 Real-World: Batch Processing

```ts
async function processBatch(items: Item[]) {
  const tasks = items.map((item) => () => api.processAndSaveItem(item)); // returns CancelablePromise

  return groupAsCancelablePromise(tasks, {
    maxConcurrent: 5,

    beforeEachCallback: (index) => {
      updateProgress(`Processing item ${index + 1}/${items.length}`);
    },

    afterEachCallback: (result, index) => {
      logSuccess(`Item ${index + 1} processed`);
    },
  });
}

const batch = processBatch(items);

// Track progress
batch.onProgress((percent) => {
  progressBar.style.width = `${percent}%`;
});

// Cancel if user navigates away
window.addEventListener('beforeunload', () => {
  batch.cancel('Page unloading');
});

const results = await batch;
```

#### 🔄 Sequential Execution

```ts
const tasks = [() => step1(), () => step2(), () => step3()];

const sequential = groupAsCancelablePromise(tasks, {
  maxConcurrent: 1,
  executeInOrder: true,
});

// Guaranteed to execute in order, one at a time
const results = await sequential;
```

---

### 5️⃣ Type Guards

Runtime type checking utilities:

```ts
import { isPromise, isCancelablePromise } from 'easy-cancelable-promise';

// Check if value is a Promise
if (isPromise(value)) {
  await value;
}

// Check if it's a CancelablePromise
if (isCancelablePromise(value)) {
  value.cancel();
  console.log(value.status);
}
```

#### 🎯 Real-World: Polymorphic Handling

```ts
function handleAsyncValue(value: unknown) {
  // Already cancelable? Use full API
  if (isCancelablePromise(value)) {
    value.onProgress((p) => console.log(`${p}%`));
    return value;
  }

  // Promise or value - convert to cancelable
  return toCancelablePromise(value);
}
```

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
| ✅ Bundle size                | ~6KB                    | 0              | ~632KB   | ~13KB        |

---

## 🚀 Get Started Now

```bash
npm install easy-cancelable-promise
```

Then in your app:

```ts
import { CancelablePromise } from 'easy-cancelable-promise';

const task = new CancelablePromise((resolve, reject, { onCancel }) => {
  const timeoutId = setTimeout(() => resolve('Done!'), 5000);
  onCancel(() => clearTimeout(timeoutId));
});

task.cancel(); // That's it!
```

**Your promises, your control.** 🎉

---

## 🌐 Related Projects

- [easy-web-worker](https://www.npmjs.com/package/easy-web-worker) - Easy Web Workers with CancelablePromise support

---

## 📝 Contributing

We welcome contributions! If you have an idea for a new feature or improvement, please open an issue or submit a pull request.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

### Built with ❤️ for developers who value control

**[⭐ Star on GitHub](https://github.com/johnny-quesada-developer/easy-cancelable-promise)** • **[📝 Report Issues](https://github.com/johnny-quesada-developer/easy-cancelable-promise/issues)** • **[📦 NPM Package](https://www.npmjs.com/package/easy-cancelable-promise)**

</div>
