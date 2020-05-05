const { TYPE_PREFIX, PRODUCT } = require('gatsby-source-shopify');
const { sourceNodes: shopifySourceNodes } = require('gatsby-source-shopify/gatsby-node');
const Pusher = require('pusher-js');

let pusher;

exports.sourceNodes = async function sourceNodes(
  args,
  pluginOptions
) {
  const { actions, createContentDigest, getNode, getNodesByType } = args;

  if (pluginOptions.preview) {
    if (!pusher) {
      pusher = new Pusher(pluginOptions.craneKey, {
        cluster: 'us3',
        authEndpoint: `https://${pluginOptions.craneHost}/api/pusher/auth`,
        forceTLS: true,
        auth: {
          headers: {
            'Shopify-Domain': pluginOptions.shopName,
            'Authentication-Token': pluginOptions.craneSecret,
          },
        },
      });
    }

    const channelSlug = pluginOptions.shopName.replace('.myshopify.com', '');


    getNodesByType(`${TYPE_PREFIX}${PRODUCT}`).forEach(node => {
      actions.touchNode({ nodeId: node.id });
    });

    const channel = pusher.subscribe(`private-${channelSlug}`);

    channel.bind('client-product-update', ({ id, ...update }) => {
      const { id: _id, internal, parent, children, ...node } = getNode(id)

      const newContent = Object.assign({}, node, update);
      
      const nodeMetadata = {
        id,
        parent,
        children,
        internal: {
          type: internal.type,
          content: JSON.stringify(newContent),
          contentDigest: createContentDigest(newContent),
        },
      }
      
      const newNode = Object.assign({}, newContent, nodeMetadata)
      actions.createNode(newNode)
    });
  }

  return shopifySourceNodes(args, pluginOptions);
}