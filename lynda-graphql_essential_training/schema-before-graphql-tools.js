import { resolversBeforeGraphqlTools } from './resolvers-before-graphql-tools';
import { makeExecutableSchema } from 'graphql-tools';

const typeDefs = `
    type Friend {
        id: ID
        firstName: String
        lastName: String
        gender: Gender
        age: Int
        language: String
        email: String
        contacts: [Contact]
    }

    type Contact {
        firstName: String
        lastName: String
    }

    enum Gender {
        MALE
        FEMALE
        OTHER
    }

    type Query {
        getFriend(id: ID): Friend
    }

    input FriendInput {
        id: ID
        firstName: String!
        lastName: String
        gender: Gender
        age: Int
        language: String
        email: String
        contacts: [ContactInput]
    }

    input ContactInput {
        firstName: String
        lastName: String 
    }

    type Mutation {
        createFriend(input: FriendInput): Friend
    }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers: resolversBeforeGraphqlTools});

export { schema };
