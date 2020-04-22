// ITSME Apply interface onto function, or make function to have type of an interface

interface jQuery {
    (selector: string): HTMLElement; // key can have type as well
    version: number;
    hello: string;
}

var $ = <jQuery>function(selector: string) {
    // Find DOM element

    // ITSME version is not defined in the function!

}

$.version = 1.18

// Below throws an error
// $.version = '1.18'

var container = $('#container');
