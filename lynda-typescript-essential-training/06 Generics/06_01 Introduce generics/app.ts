/**
 * Type variable `T` which captures the type of the provided argument `value` and later `T` is used to define the return type.
 * `T` does not have to be `T`. e.g. `TKey` `TValue`
 * `<TKey, TValue>` means the types can be specified in function call and the captured values could be used in specifying types in function body, function arguments or function return
 * @param value
 * @returns {any}
 */
function clone<T>(value: T): T {

    // Since the type of arg `value` is unknown and could be any
    // value.length results an error
    let serialized = JSON.stringify(value);
    return JSON.parse(serialized);
}

clone('Hello!')

clone(123)

var todo: Todo = {
    id: 1,
    name: 'Pick up drycleaning',
    state: TodoState.Active
};

clone(todo)

clone({ name: 'Jess' })
