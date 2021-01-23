interface IFunctor<T> {
    map<TResult>(fn: (val: T) => TResult): IFunctor<TResult>;
}
