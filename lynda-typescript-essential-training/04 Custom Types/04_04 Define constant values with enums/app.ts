interface Todo {
    name: string;
    state: TodoState;
}

enum TodoState {
    New = 1,
    Active,
    Complete,
    Deleted
}

var todo: Todo = {
    name: "Pick up dry cleaning",
    state: TodoState.New // a todo-state that is "New"
}

function deleteTodo(todo: Todo) {
    if(todo.state != TodoState.Complete) {
        throw "Can't delete incomplete task!"
    }
}