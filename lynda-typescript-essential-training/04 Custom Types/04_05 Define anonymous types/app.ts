var todo: { name: string };

// todo = { age: 41 }

// both string and array have length property
// The function just returns the sum of lengths for x and y
// Instead of x: (string | any[])
// just x: { length: number }

function totalLength(x: { length: number }, y: { length: number }): number {
    var total: number = x.length + y.length;
    return total;
}