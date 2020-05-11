const createNodeHelpers = require('gatsby-node-helpers').default;
const { TYPE_PREFIX, PRODUCT } = require('./constants');


const {
  createNodeFactory,
  // generateNodeId,
  // generateTypeName,
} = createNodeHelpers({
  typePrefix: TYPE_PREFIX,
});

module.exports.ProductNode = createNodeFactory(PRODUCT);