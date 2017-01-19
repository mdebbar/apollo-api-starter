const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express')

const createLoaders = require('./createLoaders')
const schema = require('./schema')


const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000

const app = express()
const schemaString = require('graphql').printSchema(schema)

// DEV_ONLY?
// Logging in dev mode
app.use(morgan('dev'))

// TODO: After we implement authentication, we shouldn't need a whitelist.
//       We can just enable CORS for *
const whitelist = [
  'http://localhost:3000',
]

/**
 * Enable CORS for the whitelisted origins.
 */
app.use(cors({
  origin: function(origin, callback) {
    const originIsWhitelisted = whitelist.indexOf(origin) !== -1
    callback(null, originIsWhitelisted)
  },
}))

/**
 * Expose the raw schema text at /schema
 */
app.get('/schema', (req, res) => {
  res.set('Content-Type', 'text/plain')
  res.send(schemaString)
})

/**
 * Create the GraphQL endpoint handler.
 */
const graphqlEndpoint = graphqlExpress(() => ({
  schema: schema,
  context: { loaders: createLoaders() },
  graphiql: true,
  // DEV_ONLY
  formatError: error => ({
    message: error.message,
    locations: error.locations,
    stack: error.stack,
  }),
}))

/**
 * Expose the GraphQL API and the GraphiQL tool.
 */
app.use('/graphql', bodyParser.json(), graphqlEndpoint)
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

// DEV_ONLY
// Start listening to port...
// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`API Server is now running on http://localhost:${PORT}`))
