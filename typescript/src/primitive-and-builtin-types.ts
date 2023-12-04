// https://www.typescriptlang.org/docs/handbook/2/everyday-types.html

// Without compilerOptions.strictNullChecks: true, all types have null and undefined.
// With compilerOptions.strictNullChecks: true, null and undefined have to be included explicitly
let myUndefinedIsAllowedButNotNull: number | undefined;
let myNullableAndUndefined: number | null | undefined;

// undefined is not required for optional parameter
// Compiled with --strictNullChecks, the following are identical
type T1 = (x?: number) => string; // x has type number | undefined
type T2 = (x?: number | undefined) => string; // x has type number | undefined

let x: string

/**
 * true or false
 */
let y: boolean

/**
 * There's no int or float
 */
let z: number

let a: []
let b: number[]
let c: string[]

/**
 * Use compilerOptions.noImplicitAny: true in tsconfig.json to prevent using any
 */
let d: any = { x: 0 };

async function getFavoriteNumber(): Promise<number> {
    return 26;
}

function printCoord(pt: { x: number; y: number }) {
    console.log("The coordinate's x value is " + pt.x);
    console.log("The coordinate's y value is " + pt.y);
}
printCoord({ x: 3, y: 7 });


/**
 * Optional properties
 */
function printName(obj: { first: string; last?: string }) {
    // ...
}
// Both OK
printName({ first: "Bob" });
printName({ first: "Alice", last: "Alisson" });

function printId(id: number | string) {
    console.log("Your ID is: " + id);
}
// OK
printId(101);
// OK
printId("202");

// Function returning never must have unreachable end point
function error(message: string): never {
    throw new Error(message);
}

export {};