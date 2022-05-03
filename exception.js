try {
    throw "Too big"; // Manually throw an error
    var err = new Error("Too big");
    throw err;
}
catch (err) {
    // err === 'Too big' if it's a string
    console.log(
        err.message, // Standard
        err.description, // Microsoft.
        err.number, // Microsoft. same as linenumber
        err.linenumber, // FF and Chrome
        err.name, // Standard. Initial is Error but you can change it
        err.stack // Not standard but works in all browsers.. Stack trace.
    );
}
finally {
    // success or failure, run this
}
