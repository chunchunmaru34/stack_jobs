export class Maybe<T> implements IFunctor<T> {
    static of<T>(x: T) {
        return new Maybe(x);
    }

    static None<T>() {
        return new Maybe<T>(null);
    }

    static Some<T>(x: NonNullable<T>) {
        return new Maybe(x);
    }

    get isNone() {
        return this._value === null || this._value === undefined;
    }

    get isSome() {
        return !this.isNone;
    }

    constructor(private _value: T | null | undefined) {}

    map<TResult>(fn: (value: T) => TResult): Maybe<TResult> {
        return this.isNone ? Maybe.None() : Maybe.of(fn(this._value));
    }

    flatMap<R>(fn: (d: NonNullable<T>) => Maybe<R>): Maybe<R> {
        return this.isNone ? Maybe.None() : fn(this._value as NonNullable<T>);
    }

    valueOrDefault(defaultValue: T): T {
        return this.isNone ? defaultValue : this._value;
    }

    valueOrThrow(message: string) {
        if (this.isNone) {
            throw new Error(message);
        }

        return this._value;
    }

    getValue() {
        return this._value;
    }

    toString() {
        return `Maybe(${this._value})`;
    }
}
