const axios = require('axios');
const { object, string } = require('yup');

const { ProductNode } = require('./nodes');
const { TYPE_PREFIX, PRODUCT } = require('./constants');

const PLUGIN_CONFIG_SCHEMA = object({
  shopName: string().required(),
  accessToken: string().required(),
  adminToken: string().required(),
});

function createClients(options) {
  const { shopName, accessToken, adminToken } = options;

  const storefrontClient = axios.create({
    baseURL: `https://${shopName}/api/2020-04/graphql`,
    method: 'post',
    headers: {
      'X-Shopify-Storefront-Access-Token': accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });

  const adminClient = axios.create({
    baseURL: `https://${shopName}/admin/api/2020-04/graphql.json`,
    method: 'post',
    headers: {
      'X-Shopify-Access-Token': adminToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });

  return { storefrontClient, adminClient };
}

const PRODUCT_UPDATES_QUERY = `
query($first: Int!, $after: String, $query: String) {
  products(
    first: $first
    after: $after
    query: $query
    sortKey: UPDATED_AT
    reverse: true
  ) {
    edges {
      cursor
      node {
        __typename
        id
        storefrontId
        published: publishedOnCurrentPublication
        updatedAt
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
`;

async function fetchAdminProductUpdates({ adminClient }, variables) {
  const { data } = await adminClient({
    data: {
      query: PRODUCT_UPDATES_QUERY,
      variables,
    }
  });

  return data.data.products;
}

async function* adminProductUpdates(clients, since) {
  const hourSlug = since.toISOString().substring(0, 13);
  const query = `updated_at:>${hourSlug}`;
  let { edges, pageInfo: { hasNextPage } } = await fetchAdminProductUpdates(clients, {
    first: 250,
    query,
  });

  while (1) {
    if (!edges.length) {
      break;
    }

    const batch = [];

    while (1) {
      if (batch.length === 50 || !edges.length) {
        break;
      }

      const edge = edges.shift();

      if (new Date(edge.node.updatedAt) < since) {
        yield batch;
        return;
      }
      batch.push(edge);
    }

    yield batch;

    if (edges.length < 50 && hasNextPage) {
      ({ edges, pageInfo: { hasNextPage } } = await fetchAdminProductUpdates(clients, {
        first: 250,
        query,
        after: edges.length ? edges[edges.length - 1].cursor : batch[batch.length - 1].cursor,
      }));
    }
  }
}


const PRODUCT_DELETES_QUERY = `
  query ($first: Int!, $after: String, $query: String) {
    deletionEvents(
      first: $first,
      after: $after,
      query: $query,
      subjectTypes: [PRODUCT],
      sortKey: CREATED_AT
      reverse: true
    ) {
      edges {
        cursor
        node {
          occurredAt
          subjectId
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

async function fetchAdminProductDeletes({ adminClient }, variables) {
  const { data } = await adminClient({
    data: {
      query: PRODUCT_DELETES_QUERY,
      variables,
    }
  });

  return data.data.deletionEvents;
}

async function* adminProductDeletes(clients, since) {
  const hourSlug = since.toISOString().substring(0, 13);
  const query = `occurred_at:>${hourSlug}`;
  let { edges, pageInfo: { hasNextPage } } = await fetchAdminProductDeletes(clients, {
    first: 250,
    query,
  });

  while (1) {
    if (!edges.length) {
      break;
    }

    const batch = [];

    while (1) {
      if (batch.length === 50 || !edges.length) {
        break;
      }

      const edge = edges.shift();

      if (new Date(edge.node.occurredAt) < since) {
        yield batch;
        return;
      }
      batch.push(edge);
    }

    yield batch;

    if (edges.length < 50 && hasNextPage) {
      ({ edges, pageInfo: { hasNextPage } } = await fetchAdminProductDeletes(clients, {
        first: 250,
        query,
        after: edges.length ? edges[edges.length - 1].cursor : batch[batch.length - 1].cursor,
      }));
    }
  }
}

const PRODUCTS_BY_IDS_QUERY = `
  query ($ids: [ID!]!) {
    nodes(ids: $ids) {
      ...on Product {
        id
        title
        handle
      }
    }
  }
`;


async function fetchStorefrontProducts({ storefrontClient }, ids) {
  const { data } = await storefrontClient({
    data: {
      query: PRODUCTS_BY_IDS_QUERY,
      variables: {
        ids,
      },
    }
  });

  return data.data.nodes;
}

async function* productEventsSince(clients, since) {
  for await (let deletedProductEdges of adminProductDeletes(clients, since)) {
    for (edge of deletedProductEdges) {
      yield {
        type: 'delete',
        id: Buffer.from(edge.node.subjectId).toString('base64'),
      };
    }
  }

  let published = []; // @todo batch in 50s - this array could get large right now
  for await (let updatedProductEdges of adminProductUpdates(clients, since)) {
    for (edge of updatedProductEdges) {
      if (edge.node.published) {
        published.push(edge.node.storefrontId);
      } else {
        yield {
          type: 'delete',
          id: edge.node.storefrontId,
        };
      }
    }    
  }

  while(published.length) {
    const batch = published.splice(0, 50);
    const products = await fetchStorefrontProducts(clients, batch);
    for (product of products) {
      yield {
        type: 'update',
        product,
      };
    }
  }
  
}

async function sourceNodes(
  args,
  pluginOptions
) {
  const { actions, getNode, getNodesByType, cache } = args;
  const { createNode, touchNode, deleteNode } = actions;

  const options = await PLUGIN_CONFIG_SCHEMA.validate(pluginOptions);
  const clients = createClients(options);

  const lastFetched = await cache.get('gastby-source-crane-timestamp');

  if (lastFetched) {
    getNodesByType(`${TYPE_PREFIX}${PRODUCT}`).forEach(node => touchNode({ nodeId: node.id }));
  }

  const since = lastFetched ? new Date(lastFetched) : new Date('1900-01-01T00:00:00Z');

  const startedAt = Date.now();

  for await (let event of productEventsSince(clients, since)) {
    switch (event.type) {
      case 'update': {
        const node = ProductNode(event.product);
        createNode(node);
        break;
      }
      case 'delete': {
        const node = getNode(`${TYPE_PREFIX}__${PRODUCT}__${event.id}`);

        if (!node) {
          break;
        }

        deleteNode({
          node,
        })
        break;
      }
    }
  }

  await cache.set('gastby-source-crane-timestamp', startedAt);
}

exports.sourceNodes = sourceNodes;