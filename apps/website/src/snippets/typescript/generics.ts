import { CancelablePromise, defer, groupAsCancelablePromise } from 'easy-cancelable-promise';

interface User {
  id: number;
  name: string;
}

// the type argument is the type of the result
const user = new CancelablePromise<User>((resolve) => resolve({ id: 1, name: 'Ada' }));

// then, catch and finally keep the CancelablePromise type
const name: CancelablePromise<string> = user.then((value) => value.name);
const safe: CancelablePromise<User | null> = user.catch(() => null);

// defer<T>() types resolve and the promise
const deferred = defer<User>();
deferred.resolve({ id: 2, name: 'Grace' });

// @ts-expect-error the result of this deferred is a User
deferred.resolve('Grace');

// a group resolves with the array you describe, or returns null for an empty list
const group: CancelablePromise<User[]> | null = groupAsCancelablePromise<User[]>([() => user]);

export { name, safe, group };
