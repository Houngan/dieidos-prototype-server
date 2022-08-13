const express = require("express");

const { v4 } = require("uuid");

const { createServer } = require("http");

const { ApolloServer, gql } = require("apollo-server-express");

const { PubSub } = require("apollo-server");
const pubsub = new PubSub();

let philosophies = [
  {
    id: "1",
    locution: "Trouver un équilibre Perso/Pro",
    coordinates: ["-1.8164308339635", "52.5487921"],
  },
];

let players = [{ id: "1", pseudo: "Alex" }];

const gameExample = [
  {
    player: players[0],
    input: { type: "perspective", category: "Besogneux" },
    output: { type: "idea", category: "Enthousiasme" },
  },
];

const resolvers = {
  Query: {
    Philosophies: () => philosophies,
  },

  Mutation: {
    addPhilosophy: (_, args) => {
      const newPhilosophy = {
        id: v4(),
        locution: args.locution,
        coordinates: args.coordinates,
      };

      philosophies.push(newPhilosophy);

      return newPhilosophy;
    },

    addPlayer: (_, args) => {
      const newPlayer = {
        id: v4(),
        pseudo: args.name,
      };

      console.log("args", JSON.stringify(args.ideas));

      players.push(newPlayer);

      pubsub.publish("philosophyGameModified", { philosophyGame: gameExample });

      return newPlayer;
    },
  },

  Subscription: {
    philosophyGame: {
      subscribe: () => pubsub.asyncIterator("philosophyGameModified"),
    },
  },
};

var typeDefs = gql`
  scalar Date

  type Philosophy {
    id: ID!
    locution: String
    coordinates: [Float]
  }

  type Player {
    id: ID!
    pseudo: String
  }

  input Idea {
    category: String
    modalities: [Modality]
  }

  input Modality {
    title: String
    value: Float
  }

  type Input {
    type: String
    category: String
  }

  type Output {
    type: String
    category: String
  }

  type Game {
    player: Player
    input: Input
    output: Output
  }

  type Query {
    Philosophies(limit: Int, sortField: String, sortOrder: String): [Philosophy]
  }

  type Mutation {
    addPhilosophy(
      locution: String!
      longitude: Float
      latitude: Float
      password: String
    ): Philosophy

    addPlayer(
      pseudo: String!
      philosophy_id: ID!
      password: String
      ideas: [Idea]
    ): Player

    removePlayer(id: ID!, philosophy_id: ID!): Philosophy
  }

  type Subscription {
    philosophyGame(id: ID!): [Game]
  }
`;

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
});

const httpServer = createServer(app);

server.applyMiddleware({ app, path: "/graphql" });
server.installSubscriptionHandlers(httpServer);

httpServer.listen({ port: process.env.PORT || 4000 }, () => {
  console.log("Apollo Server on http://localhost:4000/graphql");
});
