import RootDefault, {
  CancelablePromise as RootCancelablePromise,
  defer as rootDefer,
  groupAsCancelablePromise as rootGroup,
  isCancelablePromise as rootIsCancelablePromise,
  toCancelablePromise as rootToCancelablePromise,
} from 'easy-cancelable-promise';
import CancelablePromise from 'easy-cancelable-promise/CancelablePromise';
import { defer } from 'easy-cancelable-promise/defer';
import { groupAsCancelablePromise } from 'easy-cancelable-promise/groupAsCancelablePromise';
import { isCancelablePromise } from 'easy-cancelable-promise/isCancelablePromise';
import { toCancelablePromise } from 'easy-cancelable-promise/toCancelablePromise';

/**
 * Every entry of the package should share a single CancelablePromise class.
 * The old build embedded a copy of the class in each entry, so these checks were false.
 */
describe('subpaths', () => {
  it('should share the CancelablePromise class with the root entry', () => {
    expect(RootDefault).toBe(CancelablePromise);
    expect(RootCancelablePromise).toBe(CancelablePromise);
    expect(rootDefer).toBe(defer);
    expect(rootGroup).toBe(groupAsCancelablePromise);
    expect(rootToCancelablePromise).toBe(toCancelablePromise);
    expect(rootIsCancelablePromise).toBe(isCancelablePromise);
  });

  it('should create instances of the same class from different subpaths', async () => {
    const deferred = defer<string>();
    const group = groupAsCancelablePromise([() => Promise.resolve(1)]);
    const converted = toCancelablePromise(Promise.resolve(1));

    expect(deferred.promise instanceof CancelablePromise).toBe(true);
    expect(group instanceof CancelablePromise).toBe(true);
    expect(converted instanceof CancelablePromise).toBe(true);

    expect(isCancelablePromise(deferred.promise)).toBe(true);
    expect(rootIsCancelablePromise(group)).toBe(true);

    deferred.resolve('result');

    await Promise.all([deferred.promise, group, converted]);
  });
});
