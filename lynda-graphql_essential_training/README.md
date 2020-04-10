- Lynda course: https://www.lynda.com/GraphQL-tutorials/GraphQL-Essential-Training/614315-2.html
- File structure
    - data
        - schema.js
        - dbConnectors.js
        - resolvers.js
    - index.js
- Setup
    - .babel.rc.json
    - package.json
        - graphql-tools
- Fields
    - Array: `emails: [Email]`
    - Non-nullable: `emails: [Email]!`
    - Enum. All values should be upper case. In query `gender: MALE` not `gender: "MALE"`. In response `gender: "MALE"`
    - Check places when a field is added/removed/modified
        - `class Friend { constructor() {} }`
        - `type Friend {}`
        - `input FriendInput {}`
        - Field mutation `input Contact {}`

# Mutation
Schema
```graphql
input FriendInput {
    id: ID
    firstName: String!
    lastName: String
    gender: Gender
    age: Int
    language: String
    primaryEmail: String
    email: String
    contacts: [ContactInput]
}

input ContactInput {
    firstName: String
    lastName: String 
}
```

Query
```graphql
mutation {
    createFriend(input: {
        firstName: "LiF",
        lastName: "LiL",
        email: "me@me.com"
    }) {
        id
        firstName
    }      
}
```

# Query Alias
```graphql
query {
    aliasOne: getOneFriend(id: "a") {
        id
    },
    aliasTwo: getOneFriend(id: "b") {
        id
    }
}
```
vs
```graphql
{
    getOneFriend(id: "a") {
        id
    }
}
```

# Query Fragments
```graphql
query {
    aliasOne: getOneFriend(id: "a") {
        ...friendFragment
    },
    aliasTwo: getOneFriend(id: "b") {
        ...friendFragment
    }
}

fragment friendFragment on Friend {
    firstName
    lastName
}
```

# Why GraphQL vs REST?
- Type inspection
- Query multiple DBs from one GraphQL server
- Flexibility of the queries