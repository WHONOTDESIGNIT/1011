---
title: "Frameworks API"
description: "Web development frameworks and build tools can use the Frameworks API to generate project deployments that take advantage of Netlify's composable platform."
---

Developers optimizing frameworks for Netlify can use the Framework Adapter API (also called Frameworks API) to define the best way for a framework to deploy to Netlify. 

As a Framework Developer, use the API to provision and configure platform primitives so that developers don't have to, allowing for a seamless integration with the framework and a zero-config setup.

The API is file-based: as part of the build command, the framework should write files to specific directories, with a well-defined format. Netlify then reads and further processes these files to create a deployment.

## Features

### `.netlify/v1/config.json`

Use the `config.json` file to configure how Netlify builds and deploys a project. It's a subset of the [user-facing file-based configuration](/build/configure-builds/file-based-configuration) (using JSON instead of TOML) and it supports the following properties.

- [`edge_functions`](#edge-functions)
- [`functions`](#functions)
- [`headers`](#headers)
- [`images`](#images)
- [`redirects`](#redirects)

#### `edge_functions`

Accepts edge function declarations with the [same properties as the user-facing configuration](/build/edge-functions/declarations#declare-edge-functions-in-netlify-toml). While edge functions can be [configured in the same file as the function code](#configuration-options), this property is useful if you would like to declare multiple edge functions to run on the same path and customize the order they run in.

```json
{
  "edge_functions": [
    {
      "function": "auth",
      "path": "/admin"
    },
    {
      "cache": "manual",
      "function": "injector",
      "path": "/admin"
    },
    {
      "function": "auth",
      "path": "/blog/*"
    },
    {
      "function": "rewriter",
      "path": "/blog/*"
    },
    {
      "excludedPattern": "/products/things/(.*)",
      "function": "highlight",
      "pattern": "/products/(.*)"
    },
    {
      "excludedPath": "/img/*",
      "function": "common",
      "path": "/*"
    }
  ]
}
```

Entries of the `edge_functions` array in the `config.json` file only take a single path per edge function. This means that if you want to configure the edge function to run on `/path1` and `/path2`, you need to create two separate entries. This has the advantage of letting you configure the exact order of precedence of each edge function for a given path.

```json
{
  "edge_functions": [
    {
      "function": "my-framework-edge-function-1",
      "path": "/path1"
    },
    {
      "function": "my-framework-edge-function-2",
      "path": "/path1"
    },
    {
      "function": "my-framework-edge-function-2",
      "path": "/path2"
    },
    {
      "function": "my-framework-edge-function-1",
      "path": "/path2"
    }
  ]
}
```

#### `functions`

Accepts function configuration options, including any property from [the inline configuration options](#configuration-options-2). When you define the properties, we prefer snake case - for example, use `included_files` instead of `includedFiles`.

```json
{
  "functions": {
    "directory": "myfunctions/",
    "included_files": ["files/*.md"]
  }
}
```

Optionally, you can apply these settings to only a subset of a project's functions. For example, if a framework prefixes the functions it generates with `my_framework_`, it can target them within the `functions` object.

```json
{
  "functions": {
    "my_framework_*": {
      "included_files": ["files/*.md"]
    }
  }
}
```

#### `headers`

Specifies [custom headers](/manage/routing/headers) that Netlify serves with the project when a client makes a request. It follows the same capabilities as the `headers` array of the [user-facing file-based configuration.](/build/configure-builds/file-based-configuration#headers)

```json
{
  "headers": [
    {
      "for": "/*",
      "values": {
        "Basic-Auth": "someuser:somepassword anotheruser:anotherpassword",
        "X-Frame-Options": "DENY",
        "cache-control": "max-age=0,no-cache,no-store,must-revalidate"
      }
    }
  ]
}
```

#### `images`

Configures the [Netlify Image CDN](/build/image-cdn/overview). You can specify [allowed domains for remote image transformations](/build/image-cdn/overview#remote-path).

The `remote_images` property accepts an array of [regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp), which can represent specific subdomains or directories.

Note that slashes need to be double escaped (once due to the regular expression syntax, and a second time due to the JSON syntax). For example, here's how you could configure the Image CDN to allow any images under `https://example.com/`.

```json
{
  "images": {
    "remote_images": ["https:\\/\\/example.com\\/.*"]
  }
}
```

#### `redirects`

Specifies [redirect and rewrite rules](/manage/routing/redirects/overview) that Netlify evaluates when a client makes a request. It follows the same syntax as the `redirects` array of the [user-facing file-based configuration.](/build/configure-builds/file-based-configuration#redirects)

```json
{
  "redirects": [
    {
      "force": false,
      "from": "/old-path",
      "status": 301,
      "to": "/new-path",
      "conditions": {
        "Country": ["US"],
        "Language": ["en", "es"]
      },
      "query": {
        "path": ":path"
      }
    },
    {
      "from": "/news",
      "to": "/blog"
    }
  ]
}
```

These rules are appended to any rules defined by the user in [the `_redirects` file](/manage/routing/redirects/overview#syntax-for-the-_redirects-file) or [the `netlify.toml` file](/manage/routing/redirects/overview#syntax-for-the-netlify-configuration-file). Since Netlify reads rules from top to bottom and processes the first matching rule it finds, this means that the user-defined rules take precedence over rules defined in the Frameworks API.

If you want to change this behavior and ensure that the rules defined by the framework are evaluated first, you can use the `redirects!` property instead (with an exclamation mark). Please note that this takes precedence over any redirect rules defined by framework users, so use it sparingly and make sure to communicate to your framework users how this might affect their workflows.

```json
{
  "redirects!": [
    {
      "from": "/some-path",
      "to": "/new-path"
    }
  ]
}
```

### `.netlify/v1/skew-protection.json`

Use the `skew-protection.json` file to enable and customize [Skew protection](/deploy/deploy-overview#skew-protection). To make use of this feature, your framework must include a skew protection token in requests made to the server.

The skew protection token contains a fingerprint to a specific Netlify deploy ID. It's available through the `NETLIFY_SKEW_PROTECTION_TOKEN` environment variable, and is also available at runtime in [Functions](/build/functions/api/#deploy) and [Edge Functions](/build/edge-functions/api/#deploy).

You can configure skew protection to accept this token in different ways: an HTTP header, a cookie, or a query parameter. All of these can be enabled at the same time, and the framework can choose which one to use on a per-request basis. It's also up to the framework to define the names of these fields and specify which request URL paths should be checked for skew protection.

```json
{
  "patterns": [
    "/api/.*",
    ".*\\.(png|jpg|jpeg|gif|webp|svg|js|css)$"
  ],
  "sources": [
    {
      "type": "cookie",
      "name": "netlify-skew-token"
    },
    {
      "type": "header", 
      "name": "x-skew-token"
    },
    {
      "type": "query",
      "name": "skew"
    }
  ]
}
```

For example, the file above enables skew protection for API routes and static assets like images, JavaScript files and stylesheets. It configures three sources where the skew protection token can be found: a cookie named `netlify-skew-token`, an HTTP header named `x-skew-token`, and a query parameter named `skew`.

#### Configuration options

- `patterns` (`string[]`): An array of regular expressions (as strings) that define URL paths where skew protection should be applied. When multiple patterns are specified, skew protection will be applied when at least one of the patterns matches the URL path.

- `sources`: An array defining where Netlify should look for a skew protection token in incoming requests. Multiple sources can be configured simultaneously. Each source object contains:
  - `type` (`string`): Specifies the source type. Accepts `"cookie"`, `"header"`, or `"query"`.
  - `name` (`string`): The name of the cookie, HTTP header, or query parameter that contains the skew protection token.

### `.netlify/v1/blobs`

Upload [blobs](/build/data-and-storage/netlify-blobs/) to the [deploy-specific store](/build/data-and-storage/netlify-blobs/#deploy-specific-stores). This is useful if you want the ability to generate files at build time and then modify them at runtime throughout the lifecycle of the deploy.

Our build system traverses the `.netlify/v1/blobs/deploy` directory and generates a blob for each `blob` file it finds. The blob key is the path of the file relative to the `.netlify/v1/blobs/deploy` directory (without a leading slash).

```
.netlify/
└── v1/
    └── blobs/
        └── deploy/
            ├── example.com/
            │   └── blob
            └── netlify.com/
                ├── blob
                └── blob.meta.json
```

For example, the directory tree above would generate two blobs:

- a blob with the key `example.com`, holding the contents of the file at `.netlify/v1/blobs/deploy/example.com/blob`
- a blob with the key `netlify.com`, holding the contents of the file at `.netlify/v1/blobs/deploy/netlify.com/blob`

Optionally, you can include a `blob.meta.json` file that contains an object with arbitrary metadata, encoded as JSON, which you can then retrieve with the [`getMetadata`](/build/data-and-storage/netlify-blobs/#getmetadata) and [`getWithMetadata`](/build/data-and-storage/netlify-blobs/#getwithmetadata) client methods.

### Tip - Root key

You can't place a `blob` file directly under the `.netlify/v1/blobs/deploy` directory, because that would lead to an empty string as the relative path, which isn't a valid blob key. If the concept of a root key exists in your specific use case (for example, naming keys after URL paths), you can place all entries under another sub-directory, like `my-cache`, and treat `my-cache` as `/` and `my-cache/child` as `/child`.

Let's imagine that your framework implements a cache for HTTP requests. You could use Netlify Blobs to store cached responses, and make your generated [functions](#netlify-v1-functions) and [edge functions](#netlify-v1-edge-functions) check whether there's a blob for a given URL before making an HTTP call.

```ts
// .netlify/v1/functions/my-framework-cache.ts
import { getDeployStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const { domain } = context.params;
  const cache = getDeployStore();
  const cachedResponse = await cache.get(domain, { type: "stream" });

  if (cachedResponse !== null) {
    return new Response(cachedResponse);
  }

  const response = await fetch(`https://${domain}`);
  const body = await response.blob();

  await cache.set(domain, body);

  return response;
}

export const config: Config = {
  // Accepts requests on paths like "/cache/example.com".
  path: "/cache/:domain"
}
```

To pre-warm the cache with a response for `https://example.com`, you could fetch it at build time and write the response to a file at `.netlify/v1/blobs/deploy/example.com/blob`.

Additionally, you could modify the example above to also persist the headers of cached responses. To write a metadata object for the same `example.com` key, write a JSON object to `.netlify/v1/blobs/deploy/example.com/blob.meta.json` with a payload like:

```json
{
  "headers": {
    "Content-Type": "text/html; charset=UTF-8",
    "Date": "Wed, 12 Jun 2024 09:14:11 GMT"
  }
}
```

### `.netlify/v1/edge-functions`

Generate [edge functions](/build/edge-functions/overview) for a project and configure the URL paths on which they run.

Edge Functions let you intercept requests at the very beginning of the request chain, and intercept responses just before they are delivered to the client. In both cases, you have the option to modify the payloads in any way you like.

For example, you could generate an edge function that intercepts requests for JSON (by inspecting [the `Accept` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept) and [rewrite them](/build/edge-functions/api#return-a-rewrite) to a path that implements your framework's API route. If a client requests `https://example.com/products/123` and asks for a JSON response, the edge function would serve the contents of the `https://example.com/api/products/123` path.

To create this edge function, your framework would write the code below to a file at `.netlify/v1/edge-functions/my-framework-api-route-handler.ts`.

```tsx
import type { Config, Context } from "@netlify/edge-functions";

export default async (req: Request, context: Context) => {
  if (req.headers.get("accept") === "application/json") {
    const { pathname } = new URL(req.url)

    return new URL(`/api${pathname}`, req.url)
  }
}

export const config: Config = {
  // Configures the paths on which the edge function runs.
  // The value below lets you intercept requests for any path.
  path: "/*",

  // Sometimes it's useful to exclude certain paths.
  // This example will ignore requests that are
  // already targeting an `/api/` path.
  excludedPath: ["/api/*"]
};
```

#### Configuration options

To configure generated edge functions from within the function file, export a `config` object. It accepts the following properties:

- `path` (`string` or `string[]`): The URL path or set of paths for which the edge function is invoked. It accepts a string for a single path, or an array of strings for multiple paths. It supports wildcards and named parameters using [the `URLPattern` web standard syntax](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API).
- `excludedPath` (`string` or `string[]`): A URL path or set of paths for which the edge function is never invoked. It accepts a string for a single path, or an array of strings for multiple paths. It supports wildcards and named parameters using [the `URLPattern` web standard syntax](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API).
- `method` (`string` or `string[]`): A method or set of methods for which the edge function is invoked. Supported HTTP methods are GET, POST, PUT, PATCH, DELETE, and OPTIONS. If not specified, the edge function is invoked for all methods.
- `cache` (`string`): Opts in to [response caching](/build/edge-functions/optional-configuration#response-caching).
- `name` (`string`): A human-friendly name for the edge function. It is shown instead of the filename in build logs and in the UI.
- `generator` (`string`): Lets you tag an edge function with the name and the version of your framework. While this has no direct effect on any user-facing areas, it lets us internally correlate requests for this edge function with a specific framework version to identify and troubleshoot possible issues with a release.
- `onError` (`string`): Defines the behavior for [when the edge function terminates unexpectedly](/build/edge-functions/optional-configuration#error-handling). You can choose to serve a generic error page (`fail`, the default value), skip the erroring edge function and continue the request chain (`bypass`), or provide a URL path that requests are rewritten to in the event of an error (for example, `/my-framework-error-page`).
- `rateLimit` (`object`): Sets [custom rate limiting rules](/manage/security/secure-access-to-sites/rate-limiting#function-edge-function-examples) for the edge function.

### Caution - Static values only

The `config` object must be defined in [the edge function's main file](/build/edge-functions/get-started#create-an-edge-function) and it must not be renamed or re-exported. It can only use static values, which means that using constants or variables is not allowed.

#### Bundling

When an edge function is created, either directly by a user or by a framework using the Frameworks API, Netlify automatically handles the bundling process. This involves collecting all the edge function's dependencies, including local imports and [third-party modules](https://www.netlify.com/blog/support-for-npm-modules-in-edge-functions/), into a single file.

Optionally, you can choose to handle this process yourself, using tools like [esbuild](https://esbuild.github.io/) or [Vite](https://vitejs.dev/) to generate a self-contained bundle with all the dependencies inlined. When you do this, the Netlify bundling process is essentially a no-op, and we use your generated bundle as is.

There are some things to consider if you choose to do this:

- It's important to note that [edge functions run on Deno](/build/edge-functions/api#runtime-environment), not Node.js. This has the following implications:
  - You shouldn't rely on Node.js built-ins.
  - You should always generate ESM code (not CommonJS) with the latest syntax.
- If you're bundling your code using esbuild, set [the `platform` property](https://esbuild.github.io/api/#platform) to `neutral` and set [`target` to `esnext`](https://esbuild.github.io/api/#target).
- For Vite, set [`target` to `webworker`](https://github.com/netlify/remix-compute/blob/124b930bf0a72427240d744bb96e17cb2f258536/packages/remix-edge-adapter/src/plugin.ts#L49) and [mark all Node.js built-ins as external](https://github.com/netlify/remix-compute/blob/124b930bf0a72427240d744bb96e17cb2f258536/packages/remix-edge-adapter/src/plugin.ts#L51).

#### Import maps

You can customize the resolution of module specifiers in edge functions using [import maps](/build/edge-functions/api#import-maps). To do this, place a file following [the import map syntax](https://html.spec.whatwg.org/multipage/webappapis.html#import-maps) at `.netlify/v1/edge-functions/import_map.json`.

For example, the file below would let you rewrite the bare specifier `html-rewriter` to a specific remote URL, and point `utils` to a local directory so you can import `utils/ab-test.ts` instead of `./nested/directory/utils/ab-test.ts`.

```json
{
  "imports": {
    "html-rewriter": "https://ghuc.cc/worker-tools/html-rewriter/index.ts",
    "utils/": "./nested/directory/utils"
  }
}
```

### `.netlify/v1/functions`

Generate serverless functions for a project and configure the URL paths on which they run. It accepts the same naming conventions and uses the same syntax as [user-defined functions](/build/functions/get-started/?fn-language=ts).

Functions are a way to dynamically render parts of your application, like API routes. You can also use them to power your framework's [server-side rendering](https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Web_frameworks) capabilities.

For example, you could generate an SSR function by writing the following code to `.netlify/v1/functions/my-framework-ssr.ts`.

```ts
import type { Config, Context } from "@netlify/functions";
import { renderPage } from "./your-framework-code.ts";

export default async (req: Request, context: Context) => {
  const html = await renderPage(req);

  return new Response(html, {
    headers: {
      "content-type": "text/html"
    }
  });
};

export const config: Config = {
  path: "/*"

  // Sometimes it's useful to exclude certain paths.
  // This example will ignore requests that are
  // already targeting an `/api/` path.
  excludedPath: ["/api/*"]
};
```

#### Configuration options

Generated functions can be configured from within the function file using an exported `config` object. It accepts the following properties:

- `path` (`string` or `string[]`): The URL path or set of paths for which the function is invoked. It supports wildcards and named parameters using [the `URLPattern` web standard syntax](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API).
- `excludedPath` (`string` or `string[]`): A URL path or set of paths for which the function is never invoked. It accepts a string for a single path, or an array of strings for multiple paths. It supports wildcards and named parameters using [the `URLPattern` web standard syntax](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API).
- `preferStatic` (`boolean`): By default, functions run for any requests to the configured paths, regardless of whether or not they also match static files. To prevent the function from shadowing files on the CDN, set `preferStatic: true`.
- `name` (`string`): A human-friendly name for the function. It is shown instead of the filename in build logs and in the UI.
- `generator` (`string`): Lets you tag a function with the name and the version of your framework. While this has no direct effect on any user-facing areas, it lets us internally correlate requests for this function with a specific framework version to identify and troubleshoot possible issues with a release.
- `includedFiles` (`string[]`): List of additional paths to include in the function bundle. Although Netlify includes statically referenced files (like `require("./some-file.js")`) by default, you can specify additional files or directories and reference them dynamically in function code. You can use `*` to match any character or prefix an entry with `!` to exclude files. Paths are absolute paths relative to the base directory.
- `nodeBundler` (`string`): Changes the default bundling mechanism used to collect all function dependencies (including local files and third-party modules) into a deployable package. You can set it to `esbuild` if you want to use [esbuild](https://esbuild.github.io/) to bundle everything into a single file, which usually leads to a smaller payload; you can set it to `none` if you want to use [your own bundling process](#bundling-2).
- `externalNodeModules` (`string[]`): When setting `nodeBundler` to `esbuild`, this property lets you provide a list of npm packages that are marked as [external](https://esbuild.github.io/api/#external), which means their original structure is kept in a `node_modules` directory as opposed to being inlined with the function code.
- `ignoredNodeModules` (`string[]`): When setting `nodeBundler` to `esbuild`, this property lets you provide a list of npm packages that are marked as [external](https://esbuild.github.io/api/#external) but whose source is not preserved in the `node_modules` directory. This should only be used for packages that you know for a fact are not used at runtime, otherwise it can lead to an error when the function is invoked.
- `nodeVersion` (`string`): Sets the major version of Node.js to run the function with. It takes values like `20` to use Node.js 20.x, for example.
- `schedule` (`string`): When defined, turns the function into a [scheduled function](/build/functions/scheduled-functions) and defines the schedule on which it runs.
- `rateLimit` (`object`): Sets [custom rate limiting rules](/manage/security/secure-access-to-sites/rate-limiting#function-edge-function-examples) for the function.

### Caution - Static values only

The `config` object must be defined in [the function's main file](/build/functions/get-started#route-requests) and it must not be renamed or re-exported. It can only use static values, which means that using constants or variables is not allowed.

#### Bundling

When a function is created, either directly by a user or by a framework using the Frameworks API, Netlify automatically handles the bundling process by default. This means collecting all the function's dependencies, including local files and third-party modules, into a deployable package.

Optionally, you can choose to take control over this process. This may be useful if your framework already includes its own bundling pipeline. To opt out of the default bundling mechanism, you must set two configuration properties (`nodeBundler` and `includedFiles`) in the function's `config` object.

```ts
import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  return new Response("Hello world");
}

export const config: Config = {
  // Setting `nodeBundler` to `none` lets you opt out of the
  // automatic bundling process.
  nodeBundler: "none",

  // When using a custom bundling process, you must provide the
  // full list of files to include in the deployable package.
  // You can use the `includedFiles` property, which supports globs.
  includedFiles: ["my-framework-bundle-output/**"]
};
```

## Merging configurations

All Netlify platform primitives can be provisioned and configured directly by developers - for example, a developer can create a redirect rule by [writing a `_redirects` file](/manage/routing/redirects/overview#syntax-for-the-_redirects-file) or deploy a function by [writing a file to the functions directory](/build/functions/get-started#create-function-file).

The Frameworks API was designed to extend these configuration options, not override them. This means that any user-defined configurations are respected, and the following rules apply when those configurations are merged with the Frameworks API:

- For properties that are "additive" (like the [allowed domains for the Netlify Image CDN](/build/image-cdn/overview#remote-path) or [the list of serverless functions](/build/frameworks/frameworks-api#netlify-v1-functions), any entries from the Frameworks API are appended to the ones defined by the user; if order is relevant, user-defined configuration takes precedence
- For properties that are mutually-exclusive (like the [functions directory](#functions), any user-defined configuration takes precedence

### Tip - Avoid collisions with user-defined functions

To help make sure your framework-defined functions aren't overridden by user-defined functions, we recommend that you include your framework's name in your function names. For example, `my-framework-ssr.ts`.

## Versioning

The filesystem is the only interface to the Frameworks API; there are no client libraries for programmatic access. This lowers the barrier of entry to the absolute minimum, allowing any framework, of any technology stack, to take advantage of the Netlify platform by writing files to disk.

But even without pulling in a library, there is still an intrinsic dependency between the Frameworks API and any framework that uses it. As we update the API surface with new features or changes to existing ones, we will always do so in a backward-compatible way, to ensure that all framework versions continue to operate without any disruption.

To this end, all features have a version identifier in their file paths (for example, `.netlify/v1/config.json`). A breaking change to that feature would be released as `.netlify/v2/config.json`, with no changes to the previous path, giving framework authors the choice to update their implementation at their own schedule.
