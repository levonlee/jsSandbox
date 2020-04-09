import { Friends, Aliens } from './dbConnectors';

// resolver map
export const resolvers = {
    Query: {
        getFriend: (parent, { id }) => {
            // simple return
            return new Friend(id, friendDatabase[id]);
        },
        getOneFriend: (parent, { id }) => {
            return new Promise((resolve, reject) => {
                Friends.findById(id, (err, friend) => {
                    if (err) reject(err)
                    else resolve(friend)
                });
            });
        },
        getAliens: () => {
            return Aliens.findAll();
        },
    },
    Mutation: {
        createFriend: (parent, { input }) => {
            const newFriend = new Friends({
                firstName: input.firstName,
                lastName: input.lastName,
                gender: input.gender,
                age: input.age,
                language: input.language,
                email: input.email,
                contacts: input.contacts
            });

            newFriend.id = newFriend._id;

            return new Promise((resolve, reject) => {
                newFriend.save((err) => {
                    if (err) reject(err)
                    else resolve(newFriend)
                })
            })
        },
        updateFriend: (parent, { input }) => {
            return new Promise(( resolve, reject) => {
                // Friends is a Mongoose Model created by a Mongoose Schema
                // findOneAndUpdate is one method in that model
                Friends.findOneAndUpdate({ _id: input.id }, input, { new: true}, (err, friend) => {
                    if (err) reject(err)
                    else resolve(friend)
                })
            })
        },
        deleteFriend: (root, { id }) => {
            return new Promise((resolve, reject) => {
                Friends.remove({ _id: id}, (err) => {
                    if (err) reject(err)
                    else resolve('Successfully deleted friend')
                })
            })
        },
    },
};
