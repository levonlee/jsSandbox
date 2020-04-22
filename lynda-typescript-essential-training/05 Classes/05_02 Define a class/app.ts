/* From the last video...

function TodoService() {
    this.todos = [];
}

TodoService.prototype.getAll = function() {
    return this.todos;
}

*/

class TodoService {

    // function TodoService() { ... }
    constructor(private todos: Todo[]) {
    }

    // TodoService.prototype.getAll = function () { ... }
    getAll() {
        return this.todos;
    }
}

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