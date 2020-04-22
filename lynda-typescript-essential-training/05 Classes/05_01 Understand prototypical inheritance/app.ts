// myApp.abc() will look for myApp.abc, then myApp.prototype.abc, then Object.prototype.abc

function TodoService() {
    this.todos = [];
}

TodoService.prototype.getAll = function() {
    return this.todos;
}

TodoService.abc = 'abc'
console.log(TodoService.abc) // abc

var service = new TodoService();

console.log(service.getAll()) // []

console.log(service.abc) // undefined
