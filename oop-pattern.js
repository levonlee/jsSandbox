// Simple OOP pattern or prototypal pattern
Vehicle = function (year, make, model) {
    //region Public properties
    this.year = year;
    this.make = make;
    this.model = model;
    //endregion
};
Vehicle.prototype.publicProperty = '';
Vehicle.prototype.getInfo = function () {
    // Use private properties
    return this.year + ' ' + this.make + ' ' + this.model;
};
Vehicle.prototype.startEngine = function () {
    return 'Vroom';
};

(function () {
    // this === self === window
    this.myApp = this.MyApp || {};
    var ns = this.myApp; // further shorten the keyboard typing

    // private properties
    var vehicleCount = 5;
    var vehicles = [];

    // Public properties
    ns.publicHello = 'This is public';

    //region Public methods
    ns.getVehicleCount = function () {
        return vehicleCount;
    };
    ns.setVehicleCount = function (value) {
        vehicleCount = value;
    };
    //endregion

    // Define a Class
    // You can even separate the class definition into another JavaScript file
    // Just remember to include the necessary closure like the above
    ns.Vehicle = (function () {

        // Don't Do This!
        // - Since it's not in prototype, this privateStaticProperty cannot be inherited
        // - And if any prototypal method uses this variable in child class, it will throw error
        var privateStaticProperty = 'Vehicle Private Property';

        function Vehicle(year, make, model) {
            //region public properties
            this.year = year;
            this.make = make;
            this.model = model;
            //endregion
        }

        //region Public methods
        Vehicle.prototype.getInfo = function () {
            // Use public properties
            return this.year + ' ' + this.make + ' ' + this.model;
        };
        Vehicle.prototype.startEngine = function () {
            return 'Vroom';
        };
        Vehicle.prototype.setPrivateStaticProperty = function (value) {
            privateProperty = value;
        };
        Vehicle.prototype.getPrivateStaticProperty = function () {
            return privateProperty;
        };
        //endregion

        // Better not to override prototype, don't do this:
        // Vehicle.prototype = {getInfo: function () {}, startEngine: function () {}}

        return Vehicle;
    }());

    // Define a sub Class
    ns.Car = (function (parent) {

        function Car(year, make, model) {
            parent.call(this, year, make, model);
            this.wheelQuantity = 4;
        }

        // Inherit parent's prototype properties
        Car.prototype = Object.create(parent.prototype);
        // Override the constructor to this child class
        Car.prototype.constructor = Car;
        // Extend or override a parent's method
        Car.prototype.getInfo = function () {
            return 'Vehicle Type: Car ' + parent.prototype.getInfo.call(this);
        }

        return Car;
    }(ns.Vehicle));

}());

console.log(myApp.publicHello);
// undefined for private variable myApp.vehicleCount
myApp.getVehicleCount();
myApp.setVehicleCount(10);

// Instantiate
var v = new myApp.Vehicle(2012, 'Toyota', 'Rav4');
console.log(v.getInfo());

var c = new myApp.Car(2012, 'Toyota', 'Rav4');
console.log(c.getInfo());

// Instantiate Simple OOP
var vSimple = new Vehicle(2022, 'Lexus', 'UX');
console.log(vSimple.getInfo());
