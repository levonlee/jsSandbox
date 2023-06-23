Singleton = function () {
    var privateCounter = 0;

    function changeBy(val) {
        privateCounter += val;
    }

    // private methods
    function sayHello() {
        console.log('Hello');
    }

    // public methods
    return {
        sayHello: sayHello,
        increment: function () {
            changeBy(1);
        },
        callBothPrivatePublicMethods: function () {
            changeBy(1);
            this.increment();
        },
        getValue: function () {
            return privateCounter;
        },
        callbackExample_MakePrivateMethodAvailableToCallbackInsidePublicMethod: function () {
            var localGetValue = this.getValue;
            [].forEach.call(
                document.getElementsByClassName('my-class'),
                function (ele) {
                    changeBy(1);
                    console.log(
                        'callbackExample_MakePrivateMethodAvailableToCallbackInsidePublicMethod',
                        localGetValue()
                    );
                }
            )
        },
        callbackExample_CallbackFromOutside: function (cbExternal) {
            [].forEach.call(
                document.getElementsByClassName('my-class'),
                cbExternal
            )
        },
    };
}();

// Hello
Singleton.sayHello();

Singleton.increment();

// 1
console.log(Singleton.getValue());

// callbackExample_MakePrivateMethodAvailableToCallbackInsidePublicMethod 2
// callbackExample_MakePrivateMethodAvailableToCallbackInsidePublicMethod 3
// callbackExample_MakePrivateMethodAvailableToCallbackInsidePublicMethod 4
Singleton.callbackExample_MakePrivateMethodAvailableToCallbackInsidePublicMethod();

// callbackExample_CallbackFromOutside 5
// callbackExample_CallbackFromOutside 6
// callbackExample_CallbackFromOutside 7
Singleton.callbackExample_CallbackFromOutside(function (ele) {
    Singleton.increment(1);
    console.log('callbackExample_CallbackFromOutside', Singleton.getValue());
});

// 7
console.log(Singleton.getValue());

Singleton.callBothPrivatePublicMethods();

// 9
console.log(Singleton.getValue());

// Non-singleton
// Expose module as global variable
Module = function () {
    // private methods
    function sayHello() {
        console.log('Hello. I am an instance of Module');
    }

    return {
        sayHello: sayHello
    }
};

var moduleInstance1 = Module();
moduleInstance1.sayHello();
// Or
var moduleInstance2 = new Module();
moduleInstance2.sayHello();
