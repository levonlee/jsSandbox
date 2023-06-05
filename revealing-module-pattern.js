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
        callbackExample: function () {
            var localGetValue = this.getValue;
            [].forEach.call(
                document.getElementsByClassName('my-class'),
                function (ele) {
                    changeBy(1);
                    console.log('callBackExample', localGetValue());
                }
            )
        },
    };
}();

// Hello
Singleton.sayHello();

Singleton.increment();
// 1
console.log(Singleton.getValue());

Singleton.callbackExample();
// 4
console.log(Singleton.getValue());

Singleton.callBothPrivatePublicMethods();
// 6
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
// Or
var moduleInstance2 = new Module();
moduleInstance1.sayHello();
