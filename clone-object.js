var anyVariable = anyObject; // pass by reference
const food = {beef: 'beef', bacon: 'bacon'}

//region Non-Deep clone an object

// Only enumerable properties are copied :: https://www.samanthaming.com/tidbits/70-3-ways-to-clone-objects/

// "Object.assign"
// mutates target object food2 so that food2 copies all enumerable own properties from 1 or more source objects.
// It also returns the target object
var food2 = {};
console.log(Object.assign(food2, food));
// This is way is preferred
var food3 = Object.assign({}, food)

// JSON, functions are replaced with null and functions in object are replaced with undefined
var food2 = JSON.parse(JSON.stringify(food));

// Spread
// Shallow copy :: the first level is copied but deeper levels are referenced
var food2 = {...food}
//endregion
