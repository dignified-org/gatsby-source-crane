const createNodeHelpers = require('gatsby-node-helpers').default;
const { TYPE_PREFIX, PRODUCT } = require('./constants');


const {
  createNodeFactory,
  // generateNodeId,
  // generateTypeName,
} = createNodeHelpers({
  typePrefix: TYPE_PREFIX,
});

module.exports.ProductNode = createNodeFactory(PRODUCT, node => {
  // if (node.variants) {
  //   const variants = node.variants.edges.map(edge => edge.node)

  //   // Set additional fields
  //   const variantPrices = variants
  //     .map(variant => Number.parseFloat(variant.price))
  //     .filter(Boolean)
  //   node.minPrice = Math.min(...variantPrices) || 0
  //   node.maxPrice = Math.max(...variantPrices) || 0

  //   // Set children
  //   node.children = variants.map(variant =>
  //     generateNodeId(PRODUCT_VARIANT_TYPE, variant.id),
  //   )

  //   // Remove unnecessary fields
  //   delete node.variants
  // }

  return node
})