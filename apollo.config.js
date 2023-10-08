module.exports = {
  client: {
    service: {
      name: 'whos-that-pokemon',
      // URL to the GraphQL API
      url: 'https://beta.pokeapi.co/graphql/v1beta',
    },
    // Files processed by the extension
    includes: ['src/**/*.gql'],
  },
}
