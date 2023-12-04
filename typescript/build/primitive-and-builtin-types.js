// https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Without compilerOptions.strictNullChecks: true, all types have null and undefined.
// With compilerOptions.strictNullChecks: true, null and undefined have to be included explicitly
let myUndefinedIsAllowedButNotNull;
let myNullableAndUndefined;
let x;
/**
 * true or false
 */
let y;
/**
 * There's no int or float
 */
let z;
let a;
let b;
let c;
/**
 * Use compilerOptions.noImplicitAny: true in tsconfig.json to prevent using any
 */
let d = { x: 0 };
function getFavoriteNumber() {
    return __awaiter(this, void 0, void 0, function* () {
        return 26;
    });
}
function printCoord(pt) {
    console.log("The coordinate's x value is " + pt.x);
    console.log("The coordinate's y value is " + pt.y);
}
printCoord({ x: 3, y: 7 });
/**
 * Optional properties
 */
function printName(obj) {
    // ...
}
// Both OK
printName({ first: "Bob" });
printName({ first: "Alice", last: "Alisson" });
function printId(id) {
    console.log("Your ID is: " + id);
}
// OK
printId(101);
// OK
printId("202");
// Function returning never must have unreachable end point
function error(message) {
    throw new Error(message);
}
export {};
