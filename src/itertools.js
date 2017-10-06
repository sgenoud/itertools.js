// @flow

import { all, any, iter } from './builtins';
import { flatten } from './more-itertools';
import type { Maybe, Predicate, Primitive } from './types';
import { identity, primitiveIdentity } from './utils';

export function chain<T>(...iterables: Array<Iterable<T>>): Iterable<T> {
    return flatten(iterables);
}

export function compress<T>(data: Iterable<T>, selectors: Iterable<boolean>): Array<T> {
    return [...icompress(data, selectors)];
}

/**
 * Returns true when any of the items in the iterable are equal to the target object.
 *
 * Examples:
 *
 *     contains([], 'whatever')         // => false
 *     contains([3], 42)                // => false
 *     contains([3], 3)                 // => true
 *     contains([0, 1, 2], 2)           // => true
 *
 */
export function contains<T>(haystack: Iterable<T>, needle: T): boolean {
    return any(haystack, x => x === needle);
}

export function* cycle<T>(iterable: Iterable<T>): Iterable<T> {
    let saved = [...iterable];
    while (saved.length > 0) {
        for (let element of saved) {
            yield element;
        }
    }
}

export function* icompress<T>(data: Iterable<T>, selectors: Iterable<boolean>): Iterable<T> {
    for (let [d, s] of izip(data, selectors)) {
        if (s) {
            yield d;
        }
    }
}

export function* ifilter<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T> {
    for (let value of iterable) {
        if (predicate(value)) {
            yield value;
        }
    }
}

export function* imap<T, V>(iterable: Iterable<T>, mapper: T => V): Iterable<V> {
    for (let value of iterable) {
        yield mapper(value);
    }
}

export function* izip2<T1, T2>(xs: Iterable<T1>, ys: Iterable<T2>): Iterable<[T1, T2]> {
    xs = iter(xs);
    ys = iter(ys);
    for (;;) {
        const x = xs.next();
        const y = ys.next();
        if (!x.done && !y.done) {
            yield [x.value, y.value];
        } else {
            // One of the iterables exhausted
            return;
        }
    }
}

export function* izip3<T1, T2, T3>(xs: Iterable<T1>, ys: Iterable<T2>, zs: Iterable<T3>): Iterable<[T1, T2, T3]> {
    xs = iter(xs);
    ys = iter(ys);
    zs = iter(zs);
    for (;;) {
        const x = xs.next();
        const y = ys.next();
        const z = zs.next();
        if (!x.done && !y.done && !z.done) {
            yield [x.value, y.value, z.value];
        } else {
            // One of the iterables exhausted
            return;
        }
    }
}

/**
 * Like the other izip's, but generalized.  Due to type system limitations, you can only "generially"
 * zip iterables with homogeneous types, so you cannot mix types like <A, B> like you can with izip2()
 */
export function* izipAll<T>(...iters: Array<Iterable<T>>): Iterable<Array<T>> {
    // Make them all iterables
    const iterables = iters.map(iter);

    for (;;) {
        const heads: Array<IteratorResult<T, any>> = iterables.map(xs => xs.next());
        if (all(heads, h => !h.done)) {
            yield heads.map(h => ((h.value: any): T));
        } else {
            // One of the iterables exhausted
            return;
        }
    }
}

export const izip = izip2;

export function* izipLongest2<T1, T2, D>(
    xs: Iterable<T1>,
    ys: Iterable<T2>,
    filler: Maybe<D> = undefined
): Iterable<[T1 | D, T2 | D]> {
    xs = iter(xs);
    ys = iter(ys);
    for (;;) {
        const x = xs.next();
        const y = ys.next();
        if (x.done && y.done) {
            // All iterables exhausted
            return;
        } else {
            yield [!x.done ? x.value : filler, !y.done ? y.value : filler];
        }
    }
}

export function* takewhile<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T> {
    for (let value of iterable) {
        if (!predicate(value)) return;
        yield value;
    }
}

export function zipAll<T>(...iters: Array<Iterable<T>>): Array<Array<T>> {
    return [...izipAll(...iters)];
}

export function zipLongest2<T1, T2, D>(
    xs: Iterable<T1>,
    ys: Iterable<T2>,
    filler: Maybe<D> = undefined
): Array<[T1 | D, T2 | D]> {
    return [...izipLongest2(xs, ys, filler)];
}

export const izipLongest = izipLongest2;
export const zipLongest = zipLongest2;