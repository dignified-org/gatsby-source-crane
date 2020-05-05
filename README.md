# Gatsby Source Crane

*THIS IS EXTREMELY EXPERIMENTAL - DO NOT USE*

1. Replace `gatsby-source-shopify` with below
```js
{
  resolve: 'gatsby-source-crane',
  options: {
    // The domain name of your Shopify shop. This is required.
    // Example: 'gatsby-source-shopify-test-shop' if your Shopify address is
    // 'gatsby-source-shopify-test-shop.myshopify.com'.
    shopName: process.env.SHOP_NAME,
    
    // An API access token to your Shopify shop. This is required.
    // You can generate an access token in the "Manage private apps" section
    // of your shop's Apps settings. In the Storefront API section, be sure
    // to select "Allow this app to access your storefront data using the
    // Storefront API".
    // See: https://help.shopify.com/api/custom-storefronts/storefront-api/getting-started#authentication
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    
    // Set verbose to true to display a verbose output on `npm run develop`
    // or `npm run build`. This prints which nodes are being fetched and how
    // much time was required to fetch and process the data.
    // Defaults to true.
    verbose: true,

    preview: !!process.env.CRANE_KEY,
    craneKey: process.env.CRANE_SECRET,
    craneSecret: process.env.CRANE_SECRET,
    craneHost: process.env.CRANE_HOST,
  },
```