var a = new Array() // not recommended

a[0] = 'Paul'
a = ['P', 'C', 'S'] // never put comma at the end of array
console.log(a[a.length - 1]) // last element
a[a.length] = 'Z' // append to last

var fruits = []

// Check if data type is array
console.log('Array.isArray(fruits)', Array.isArray(fruits)) // true or false
console.log('fruits instanceof Array', fruits instanceof Array) // true or false

fruits = ['banana', 'apple']

// If array contains a string. Case sensitive

// Array.prototype.indexOf(searchElement[, fromIndex])
console.log('fruits.indexOf(\'banana\')', fruits.indexOf('banana')) // 0
console.log('fruits.indexOf(\'abc\')', fruits.indexOf('abc')) // -1

/*
If array contains a string. Case sensitive

Array.prototype.includes(valueToFind[, fromIndex])
- return :: true | false
*/
console.log('Array.prototype.includes()',
  fruits.includes('banana'),
)

/*
If array contains a string. Case insensitive

Array.prototype.find(callback(element[, index[, array]])[, thisArg])
ES2015
return index of the first element in the array that satisfies the provided testing function. Otherwise, it returns -1
callback
- element :: value of the element
- index :: index of the element
- array :: Array object being traversed
*/

let query = 'Banana'
console.log('Array.prototype.findIndex()',
  fruits.findIndex(
    item => query.toLowerCase() === item.toLowerCase(),
  ),
)

/*

Array.prototype.splice(start[, deleteCount[, item1[, item2[, ...]]]])
- Mutable
- start :: start index
- deleteCount
- item1, item2, ... :: elements to add to the array from `start`. If not specified, elements will be removed
- return
  - An array containing the deleted elements
  - If only one element is removed, an array of one element is returned
  - If no elements are removed, an empty array is returned
*/

// Find and delete the first matched element
var index = fruits.indexOf('Banana')
if (index !== -1) {
  fruits.splice(index, 1)
}

/*
Sort array

Array.prototype.sort([compareFunction(firstElement, secondElement)])
- Mutable
- compareFunction
  - If omitted, the array elements are converted to strings then sorted according to UTF-16 code point value (ascending)
- return sorted array
*/

console.log('Array.prototype.sort()',
  fruits.sort()
)

let arrayInt = [ 342, 123 ];
console.log('Array.prototype.sort() numeric ascending',
  arrayInt.sort(function(a,b) {return a - b; })
)

// descending order
console.log('Array.prototype.sort() numeric descending',
  arrayInt.sort(function(a,b) { return b - a; })
)


/*
Whether all elements in the array pass the test implemented by the provided function. It returns a Boolean value.

Array.prototype.every(callback(element[, index[, array]])[, thisArg])
*/

const isAnagram = (word1, word2) => {
  const charsInWord = {};
  const maxLength = Math.max(word1.length, word2.length);
  for (let index = 0; index < maxLength; index++) {
    const char1 = word1.charCodeAt(index);
    const char2 = word2.charCodeAt(index);
    if (char1 >= 97 && char1 <= 122) {
      charsInWord[char1] = (charsInWord[char1] || 0) + 1;
    }
    if (char2 >= 97 && char2 <= 122) {
      charsInWord[char2] = (charsInWord[char2] || 0) - 1;
    }
  }
  return Object.values(charsInWord).every((charCount) => charCount === 0);
}

console.log("Array.prototype.every() Anagram Checker:",isAnagram('',''));
