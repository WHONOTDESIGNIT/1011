---
title: "Astro on Netlify"
description: "Learn about Astro and deploy an Astro application with server-side rendering (SSR) on our platform."
---

Astro is a framework that focuses on performance - by default, it ships zero client-side JavaScript. When needed, Astro adds partial hydration to make use of the [Islands Architecture](https://docs.astro.build/en/concepts/islands/). You can also use your favorite framework (like Vue, React, or Svelte) inside your Astro projects.

### Promoted Content

**Title - Explore an Astro site**

**description**
Prefer to explore working examples first? Return to this guide to understand key features and for extra setup help.

## Key features

These features provide important benefits for Astro projects, including those built by and deployed with Netlify.

- **Server islands.** To balance performance and personalization, use a server island to add dynamic content to an otherwise static HTML page. Learn more about server islands in this [working example](https://server-islands.com/), this [Astro blog](https://astro.build/blog/astro-4120/), or our [developer guide](https://developers.netlify.com/guides/how-astros-server-islands-deliver-progressive-rendering-for-your-sites/).
- **Image optimization.** Astro's [`<Image />` component](https://docs.astro.build/en/guides/images/#images-in-astro-files), backed by [Netlify Image CDN](#netlify-image-cdn), automatically displays optimized versions of your images.
- **Page-level custom headers**. Astro gives developers full control of caching headers with [`Astro.response.headers`](https://docs.astro.build/en/guides/server-side-rendering/#astroresponseheaders), allowing them to take advantage of Netlify's durable cache and Incremental Static Regeneration (ISR). Learn more from examples in our [Astro guide](https://developers.netlify.com/guides/how-to-do-advanced-caching-and-isr-with-astro/) or from our framework-agnostic [Advanced Caching guide](https://developers.netlify.com/guides/advanced-caching-made-easy/).
- **Use one or more frameworks.** When you use Astro, you can continue using your favorite frameworks. You can mix and match multiple framework components inside your Astro files - letting you choose what works best for your project.
- **On-demand server-side rendering (SSR)**. Server-side rendering with Astro enables you to render dynamic data without shipping client-side JavaScript and without slowing down pages that don't need that functionality.
- **Skew protection**. Starting with Astro version 5.15.0, it uses Netlify's [skew protection](https://docs.netlify.com/deploy/deploy-overview/#skew-protection) to ensure that users accessing your site during a deployment continue to receive content from the same deploy version.

## Netlify integration

For most projects, our recommendation is that you install Astro's [Netlify Adapter](https://docs.astro.build/en/guides/deploy/netlify/#adapter-for-on-demand-rendering). The adapter is actively maintained by the Astro team. 

In your Astro project's directory, run:

```shell
npx astro add netlify
```

This will install the adapter and make the appropriate changes to your `astro.config.mjs` file in one step.

If your site does not use _any_ of Astro's server-side features and does not need out-of-the-box Netlify Image CDN support for Astro's [`<Image />` component](https://docs.astro.build/en/guides/images/#image-), you can also deploy your project to Netlify without the adapter. 

Whether you use the adapter or not, Netlify automatically detects Astro in your project and provides a suggested build command (`astro build`) and output directory (`dist`).

Here are some notable Astro features that are available when using the adapter:

### Netlify Image CDN

When using the Netlify Adapter, the Astro `<Image />` component automatically uses [Netlify Image CDN](/build/image-cdn/overview) to transform images on demand, without slowing down build times. The Image CDN also handles content negotiation to use the most efficient image format for the requesting client.

To transform a source image hosted on another domain, you must first configure allowed domains in your `astro.config.mjs` file. Visit the [Astro docs](https://docs.astro.build/en/guides/images/#authorizing-remote-images) to learn more.

### On-demand (server-side) rendering

Astro's [on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) enables you to add useful functionality to your app like implementing login sessions and rendering dynamic up-to-date data, utilizing server-side rendering (SSR) only when required.

On Netlify, on-demand rendering is powered by [Netlify Functions](/build/functions/overview).

### Native local development support

Starting with Astro 5.12, you no longer need to use the Netlify CLI to have the functionality of Netlify available when running locally, as long as you have the [adapter installed](#netlify-integration). Rather, you can simply use `npm run dev` or `astro dev` normally. Astro is a Vite-based framework, and thus benefits from using the [Netlify Vite plugin](https://www.npmjs.com/package/@netlify/vite-plugin) to unlock all functionality that the plugin supports.

The functionality emulated locally includes:
- Serverless functions
- Edge functions
- Blobs
- Cache API
- Image CDN
- Redirects & rewrites
- Headers
- Environment variables
- [AI Gateway](/build/ai-gateway/overview)

### Middleware and Edge Functions

Astro's [middleware](https://docs.astro.build/en/guides/middleware/) runs at build-time for pre-rendered pages, and on-demand for server-rendered pages. On Netlify, middleware for on-demand pages uses [Netlify Edge functions](/build/edge-functions/overview) behind the scenes, running on the network edge.

You can add additional edge functions to enrich your site and deliver fast, personalized web experiences using an open runtime at the network edge. To learn what's possible, visit the [Edge Functions examples page](https://edge-functions-examples.netlify.app/)

## More resources

- [Typical Astro build settings](/build/frameworks/overview#astro)
- [Netlify Blog: Astro posts](https://www.netlify.com/tags/astro/)
- [Astro + Netlify Starter repo](https://github.com/netlify-templates/astro-platform-starter)
- [Astro documentation](https://docs.astro.build/en/getting-started/)
