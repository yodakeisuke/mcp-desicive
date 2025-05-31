import { ok, err, Result } from 'neverthrow';
import { randomUUID } from 'crypto';

export interface NonEmptyString {
    readonly _tag: 'NonEmptyString';
    readonly value: string;
}
export const NonEmptyString = {
    from: (s: string): Result<NonEmptyString, string> => {
        const trimmed = s.trim();
        if (trimmed !== '') {
            return ok({ _tag: 'NonEmptyString', value: trimmed });
        }
        return err('String cannot be empty or blank');
    },

    value: (s: NonEmptyString): string => s.value
} as const;

export type PositiveNumber = number & { readonly _tag: 'PositiveNumber' };
export const PositiveNumber = {
    from: (n: number): Result<PositiveNumber, string> =>
        n > 0 ? ok(n as PositiveNumber)
            : err('Value must be a positive number'),

    plus: (a: PositiveNumber, b: PositiveNumber): PositiveNumber =>
        (a + b) as PositiveNumber,

    plusRaw: (
        base: PositiveNumber,
        delta: number,
    ): Result<PositiveNumber, string> =>
        base + delta > 0 ? ok((base + delta) as PositiveNumber)
            : err('Resulting value must be a positive number'),

    minus: (
        a: PositiveNumber,
        b: PositiveNumber,
    ): Result<PositiveNumber, string> =>
        a - b > 0 ? ok((a - b) as PositiveNumber)
            : err('Resulting value must be a positive number'),

    minusRaw: (
        base: PositiveNumber,
        delta: number,
    ): Result<PositiveNumber, string> =>
        base - delta > 0 ? ok((base - delta) as PositiveNumber)
            : err('Resulting value must be a positive number'),

    compareTo: (a: PositiveNumber, b: PositiveNumber): -1 | 0 | 1 =>
        a === b ? 0 : a > b ? 1 : -1,

    value: (n: PositiveNumber): number => n
} as const;

export type ID<T> = string & { readonly _tag: 'ID'; readonly _phantom?: T };
export const ID = {
    generate: <T = unknown>(): ID<T> =>
        randomUUID() as ID<T>,

    value: <T>(id: ID<T>): string => id
} as const;

export type NonEmptyArray<T> = [T, ...T[]];
export const NonEmptyArray = {
    from: <T>(xs: T[]): Result<NonEmptyArray<T>, string> =>
        xs.length > 0 ? ok(xs as NonEmptyArray<T>)
            : err('Array cannot be empty')
} as const;