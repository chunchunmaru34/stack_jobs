export function compose(...fns: Function[]) {
    return (args) => {
        fns.reduceRight((arg, fn) => fn(arg), args);
    };
}

export function pipe(...fns: Function[]) {
    return (args) => {
        fns.reduce((arg, fn) => fn(arg), args);
    };
}
