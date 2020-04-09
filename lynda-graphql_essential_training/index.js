import express from 'express';
import graphqlHTTP from 'express-graphql';
import { schema } from './data/schema';

const app = express();

app.get('/', (req, res) => {
    res.send('GraphQL is amazing!');
});

// Don't need rootValue as we use graphql-tools where schema is an executableSchema which also includes resolvers
// const root = resolvers;

app.use('/graphql', graphqlHTTP({
    schema: schema,
    // Don't need rootValue as we use graphql-tools where schema is an executableSchema which also includes resolvers
    // rootValue: root, // feed resolvers
    graphiql: true, // GUI served over HTTP
}))

app.listen(8082, () => console.log('Running server on port localhost:8082/graphql'));