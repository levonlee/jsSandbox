class Friend {
    constructor(id, { firstName, lastName, gender, age, language, email, contacts }) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.age = age;
        this.language = language;
        this.email = email;
        this.contacts = contacts;
    }
}

const friendDatabase = {};

// resolver map :: https://www.apollographql.com/docs/apollo-server/data/resolvers/
// A resolver is a function that's responsible for populating the data for a single field in your schema

// A resolver can optionally accept four positional arguments: (parent, args, context, info)

export const resolversBeforeGraphqlTools = {
    Query: {
        getFriend: (parent, { id }) => {
            return new Friend(id, friendDatabase[id]);
        },
    },
    Mutation: {
        createFriend: (parent, { input }) => {
            let id = require('crypto').randomBytes(10).toString('hex');
            friendDatabase[id] = input;
            return new Friend(id, input);
        },
    },
};
