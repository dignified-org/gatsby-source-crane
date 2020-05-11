const PRODUCT_VARIANT_FRAGMENT = `
fragment VariantFragment on ProductVariant {
  availableForSale
  compareAtPriceV2 {
    amount
    currencyCode
  }
  id
  image {
    altText
    id
    originalSrc
  }
  metafields(first: 250) {
    edges {
      node {
        description
        id
        key
        namespace
        value
        valueType
      }
    }
  }
  priceV2 {
    amount
    currencyCode
  }
  requiresShipping
  selectedOptions {
    name
    value
  }
  sku
  title
  weight
  weightUnit
  presentmentPrices(first: 250) {
    edges {
      node {
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
}
`;

module.exports.PRODUCT_FRAGMENT = `
${PRODUCT_VARIANT_FRAGMENT}
fragment ProductFragment on Product {
  availableForSale
  createdAt
  description
  descriptionHtml
  handle
  id
  images(first: 250) {
    edges {
      node {
        id
        altText
        originalSrc
      }
    }
  }
  metafields(first: 250) {
    edges {
      node {
        description
        id
        key
        namespace
        value
        valueType
      }
    }
  }
  onlineStoreUrl
  options {
    id
    name
    values
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
    maxVariantPrice {
      amount
      currencyCode
    }
  }
  productType
  publishedAt
  tags
  title
  updatedAt
  variants(first: 250) {
    edges {
      node {
        ...VariantFragment
      }
    }
  }
  vendor
}
`;