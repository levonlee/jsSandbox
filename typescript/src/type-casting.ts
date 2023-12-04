// Also call Type Assertion

let x: number

// TypeScript only allows type assertions which convert to a more specific or less specific version of a type. This rule prevents “impossible” coercions like:
// x = "123" as number

x = "123" as any

export {};