# Gatsby Source Crane

*THIS IS EXTREMELY EXPERIMENTAL - DO NOT USE*

1. Replace `gatsby-source-shopify` with below
```js
{
  resolve: 'gatsby-source-crane',
  options: {
    shopName: process.env.SHOP_NAME,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    adminToken: process.env.SHOPIFY_ADMIN_TOKEN,
  },
```