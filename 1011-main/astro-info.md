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

---
title: "File-based configuration"
description: "Use a netlify.toml configuration file to specify how the platform builds and deploys your project."
---

In addition to using the Netlify UI to configure [build settings](/build/configure-builds/overview#build-settings), [deploy settings](/build/post-processing/overview/), and [environment variables](/build/environment-variables/overview), you can also configure many of these settings in a `netlify.toml` file.

### Caution - File-based configuration settings take precedence

Be aware that if you have conflicting configuration values, settings specified in `netlify.toml` override any corresponding settings in the Netlify UI.

The `netlify.toml` is a configuration file that specifies how Netlify builds and deploys your site - including redirects, branch and context-specific settings, and more. Its goal is to describe much of your project configuration alongside your code - with two goals:

- When someone forks your repository, they can instantly create a Netlify site using the new repo. They don't have to configure anything in the UI, and they'll still get an identical project configuration.
- You can track configuration changes using version control and configure some things that aren't customizable in our UI.

There are other ways to accomplish some of the things you would use the `netlify.toml` for. For example, you can use [`_headers`](/manage/routing/headers) and [`_redirects`](/manage/routing/redirects/overview) files to accomplish what the filename suggests, but having these settings all live in the same file can greatly simplify maintaining them.

There are also certain settings that you can only configure using the Netlify UI, CLI, or API. The `netlify.toml` file is not a fully comprehensive configuration method. 

### Tip - Declare environment variables in the Netlify UI for more options

While you can use `netlify.toml` to declare environment variables, we recommend that you use the [Netlify UI](/build/environment-variables/get-started/#create-environment-variables) to avoid storing sensitive values in your repository, and for the option to set [scopes](/build/environment-variables/overview#scopes), track changes in the [team audit log](/manage/accounts-and-billing/team-management/team-audit-log), and access values with the Netlify [CLI](/api-and-cli-guides/cli-guides/get-started-with-cli#manage-environment-variables) and [API](/api-and-cli-guides/api-guides/get-started-with-api#environment-variables).

The following sections will go through where to store the `netlify.toml`, each thing you'll be able to do in the file, and some examples that you could use in your code. For more information on TOML syntax, visit the [TOML website](https://toml.io/en/).

## File location

The `netlify.toml` is normally stored in the root of your site repository. You also have the option to include different configuration files in other directories for special cases such as [monorepos](/build/configure-builds/monorepos#use-a-netlify-configuration-file). 

If you store the Netlify configuration file in a directory other than the root, you will need to set either the [base directory](/build/configure-builds/overview#set-the-base-directory) or the [package directory](/build/configure-builds/overview#set-the-package-directory) to indicate where it is located. Learn more about [how Netlify searches for your configuration file](/build/configure-builds/monorepos#how-netlify-finds-your-configuration-files) in our monorepos doc.

## Configuration details

The following sections provide details for some commonly used configuration settings.

All paths configured in the `netlify.toml` should be absolute paths relative to the [base directory](/build/configure-builds/overview#definitions), which is the root by default (`/`).

### Build settings

The `[build]` command runs in the Bash shell, allowing you to add Bash-⁠compatible syntax to the command. Netlify also supports these properties (keys) for the `[build]` command:

- `base`: to specify the [base directory](/build/configure-builds/overview#definitions) 
- `publish`: to specify the [publish directory](/build/configure-builds/overview#definitions)
- `command`: to specify the [build command](/build/configure-builds/overview#definitions)
- `environment`: to declare [build environment variables](/build/configure-builds/environment-variables)
- `processing`: to configure [post-processing settings](#post-processing)

If a key has a list of key/value pairs as its value, you can set that key in its own block like this:

```toml
[build.environment]
  VARIABLE = "value"
```

### Ignore builds

Netlify tries to determine if there are any changes in the site's base directory by comparing the last known version of the files within that directory. If no change is detected, the build system skips the build, returning early from the build process.

To override the default check with a custom workflow, you can use the `ignore` attribute in `netlify.toml`. This allows you to specify a Bash or Node.js command to determine whether the site needs rebuilding or not.

Check out our [ignore builds](/build/configure-builds/ignore-builds) doc for more information on the default ignore behavior and details about constructing a custom `ignore` command.

### Build Plugins

Netlify [Build Plugins](/extend/install-and-use/build-plugins) extend the functionality of the build process. In addition to installing plugins through the 
### NavigationPath Component:

Project configuration > Build & deploy > Build plugins
 section in the Netlify UI, you can also add them to a site using [file-based installation](/extend/install-and-use/build-plugins#file-based-installation). Here's an example `[[plugins]]` section in `netlify.toml`:

```toml
[[plugins]]
package = "netlify-plugin-check-output-for-puppy-references"
  [plugins.inputs]
  breeds = ["pomeranian", "chihuahua", "bulldog"]
```

For more detailed information about installing and removing plugins, configuration options, and building and sharing different types of plugins, check out our [Build Plugins](/extend/install-and-use/build-plugins) docs.

### Extensions

Some [extensions](/extend/install-and-use/extensions-and-integrations/) run during the build-deploy lifecycle for a site - for example, to analyze your build or to inject edge functions and serverless functions. If you install an extension that runs during the build process, you can configure the extension in `netlify.toml` for the sites that use it. 

1. Follow the instructions to [install the extension](/extend/install-and-use/extensions-and-integrations/#install-an-extension) on your team.
2. Use `[[integrations]]` in your `netlify.toml` to configure the extension settings for each site that uses the extension. 

Here is an example:

```toml
[[integrations]]
  name = "abc-performance-extension"

  [integrations.config]
    output_path = "reports/performance-reports.html"
    fail_deploy_on_score_thresholds = "true"
  
  [integrations.config.thresholds]
    performance = 0.9
    accessibility = 0.9
    best-practices = 0.9
    seo = 0.9
    pwa = 0.9
```

The extension author defines the format of the configuration options you can provide in `netlify.toml`, so we recommend reviewing the extension's documentation for detailed instructions.

### Deploy contexts

Certain keys, such as `[build]` and `[[plugins]]` but not `[[redirects]]` or `[[headers]]`, allow you to set `[context]` properties based on the [kind of deploy](/deploy/deploy-overview#deploy-contexts). These keys are _context-aware_.

During a build, the following ordering determines which context covers a particular deploy:

- UI settings are overridden if a `netlify.toml` file is present and a setting for the same property/redirect/header exists in the UI and the TOML file.
- any property of a context-aware key, such as `[build]` or `[[plugins]]`, will be applied to all contexts unless the same property key is present in a more specific context.
- any property in `[context.production]`, `[context.deploy-preview]`, `[context.branch-deploy]`, or `[context.dev]` will override less specific contexts:
  - production - a deploy generated from the production branch set in the UI under 
### NavigationPath Component:

Project configuration > Build & deploy > Continuous deployment > Branches and deploy contexts

  - deploy-preview - a deploy generated from a pull request or merge request
  - branch-deploy - a deploy generated from a branch that is not your production branch
  - dev - local development environments run using [Netlify Dev](/api-and-cli-guides/cli-guides/local-development). Use `[context.dev]` to set environment variables and use the [`[dev]`](/build/configure-builds/file-based-configuration/#netlify-dev) section to configure all other local development properties.
- any property in `[context.branchname]`, for a given branchname, is the most specific, and thus overrides all the less specific contexts.

```toml
# Production context: all deploys from the Production branch
# set in your site's Branches settings in the UI will inherit
# these settings.
[context.production]
  publish = "output/"
  command = "make publish"

# Deploy Preview context: all deploys generated from
# a pull/merge request will inherit these settings.
[context.deploy-preview]
  publish = "dist/"
```

### Post processing

You can manage the Pretty URLs post processing setting with the `processing` property. 

#### Pretty URLs

This setting overrides the corresponding setting under 
### NavigationPath Component:

Project configuration > Build & deploy > Post processing > Pretty URLs
.

```toml
[build.processing.html]
  pretty_urls = true
```

### Redirects

You can manage your [redirects](/manage/routing/redirects/overview) directly in your `netlify.toml`. For each redirect you want to declare, add an entry with the `[[redirects]]` heading:

```toml
[[redirects]]
  from = "/old-path"
  to = "/new-path"
  status = 301
  force = false
  query = {path = ":path"} #  apply this rule for /old-path?path=example
  conditions = {Language = ["en","es"], Country = ["US"]}

[[redirects]]
  from = "/news"
  to = "/blog"
```

Here's a [proxy redirect](/manage/routing/redirects/rewrites-proxies#proxy-to-another-service):

```toml
[[redirects]]
  from = "/api/*"
  to = "https://us-central1-netlify-intercom.cloudfunctions.net/readHeaders/:splat"
  status = 200
  force = true
  conditions = {Role = ["admin", "cms"]}
  [redirects.headers]
    X-From = "Netlify"
    X-Api-Key = "some-api-key-string"
```

You can redirect your netlify subdomain to your custom domain. Note that the `force = true` is equivalent to the `!` (for [shadowing](/manage/routing/redirects/rewrites-proxies#shadowing) in the `_redirects` file:

```toml
[[redirects]]
  from = "https://somenetlifysite.netlify.app"
  to = "https://mycustomdomain.com"
  status = 301
  force = true
```

For more details on options to use with your redirects, review the [redirect options](/manage/routing/redirects/redirect-options) doc.

### Headers

You can define custom [headers](/manage/routing/headers) in `netlify.toml`. Here is an example of some headers you could configure:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"

    #  Multi-value headers are expressed with multi-line strings
	cache-control = '''
	max-age=0,
	no-cache,
	no-store,
	must-revalidate'''

    # The Basic-Auth header may not be available on all plans.
    Basic-Auth = "someuser:somepassword anotheruser:anotherpassword"
```

By default, headers set in the `netlify.toml` are global for all builds and cannot be scoped for specific branches or deploy contexts. However, there is a workaround you can use to [set unique headers for each deploy context](/manage/routing/headers#custom-headers-for-different-branch-or-deploy-contexts).

### Functions

Although there are default settings for [Netlify Functions](/build/functions/overview) to help you get started, you can use the `[functions]` section in `netlify.toml` for optional, custom configuration.

The following property applies for all functions:

- **`directory`:** custom absolute path to your functions. The default location is `YOUR_BASE_DIRECTORY/netlify/functions`.

Meanwhile, the following properties apply only for functions written in TypeScript or JavaScript. You can set them for all functions in your project or filter them by name, including using [glob patterns](https://www.npmjs.com/package/glob#glob-primer). If a function matches several configuration blocks containing one of these properties, the values are concatenated.

- **`node_bundler`:** function bundling method used in [@netlify/zip-it-and-ship-it](https://github.com/netlify/zip-it-and-ship-it). Valid values:
  - **`esbuild`:** method that leverages [esbuild](https://esbuild.github.io/) to bundle functions, resulting in shorter bundling times and smaller artifacts. TypeScript functions always use `esbuild`.
  - **`zisi`:** default function bundling method for JavaScript functions.
- **`external_node_modules`:** list of Node.js modules that are copied to the bundled artifact without adjusting their source or references during the bundling process; only applies when `node_bundler` is set to `esbuild`. This property helps handle dependencies that can't be inlined, such as modules with native add-ons.
- **`included_files`:** list of additional paths to include in the function bundle. Although our build system includes statically referenced files (like `require("./some-file.js")`) by default, `included_files` lets you specify additional files or directories and reference them dynamically in function code. You can use `*` to match any character or prefix an entry with `!` to exclude files. Paths are absolute paths relative to the [base directory](/build/configure-builds/overview#definitions-1).

  For more context, check out our blog post about [including files in Netlify Functions](https://www.netlify.com/blog/2021/08/12/how-to-include-files-in-netlify-serverless-functions/) with caveats for the `esbuild` bundler.

```toml
[functions]
  # Sets a custom directory for Netlify Functions
  directory = "myfunctions/"

  # Specifies `esbuild` for functions bundling
  node_bundler = "esbuild"

  # Flags "package-1" as an external node module for all functions
  external_node_modules = ["package-1"]

  # Includes all Markdown files inside the "files/" directory.
  included_files = ["files/*.md"]

[functions."api_*"]
  # Flags "package-2" as an external node module for functions
  # with a name beginning with "api_". Functions matching this
  # pattern have both "package-1" and "package-2" as
  # external modules, because modules from this object
  # are concatenated with any from the top-level object.
  external_node_modules = ["package-2"]

  # Includes all Markdown files previously defined in the
  # top-level object, except for "post-1.md".
  included_files = ["!files/post-1.md"]

[functions.api_payment]
  # Flags "package-3" and "package-4" as external node modules
  # for a function named "api_payment".
  # This function has 4 external node modules:
  #  "package-1" from the top-level object
  #  "package-2" from the "api_*" object
  #  "package-3" and "package-4" from this object
  external_node_modules = ["package-3", "package-4"]

  # Includes all Markdown files inside "files/", except for
  # "post-1.md" (excluded in the "api_*" object)
  # and "post-2.md" (excluded in this object).
  # Also includes "package.json" and any files
  # inside "images/" or any of its subdirectories.
  included_files = ["!files/post-2.md", "package.json", "images/**"]
```

### Netlify Dev

[Netlify Dev](/api-and-cli-guides/cli-guides/local-development) uses [detectors](/api-and-cli-guides/cli-guides/local-development#project-detection) to enable a local development environment for most tools and frameworks without any additional setup.

You can use the `[dev]` section in `netlify.toml` for optional configuration. Note that `[dev]` doesn't run in the Bash shell, however, so you won't be able to use Bash-⁠compatible syntax with the command.

All paths configured in the `[dev]` section should be absolute paths relative to the [base directory](/build/configure-builds/overview#definitions), which is the root by default (`/`).

Netlify Dev also makes use of the [functions directory setting](#functions) to scaffold and serve your functions in a local development environment.

`[dev]` includes optional properties such as these:

- **`command`:** command that starts your development server or runs a command such as a compiler watch in the background. If no `targetPort` is specified, it runs the command in the background in addition to the static file server.
- **`port`:** port that Netlify Dev is accessible from in the browser.
- **`targetPort`:** port for your application server, framework, or site generator. If provided, the CLI will wait until the provided `targetPort` is reachable and then proxy requests to it. If you specify values for both `command` and `targetPort`, `framework` must be `#custom`.
- **`functionsPort`**: the port where Netlify Dev serves functions.
- **`publish`:** path to your static content folder.
- **`jwtRolePath`:** object path that points to role values for JWT-based redirects.
- **`jwtSecret`:** secret used to verify tokens for JWT-based redirects.
- **`autoLaunch`:** boolean value that determines whether Netlify Dev launches the local server address in your browser.
- **`framework`:** setting to use if a project is detected incorrectly, flagged by multiple detectors, or requires a `command` and `targetPort`. Valid values:
  - **`#auto`:** default, tests all available detectors.
  - **`#static`:** property that specifies a static file server.
  - **`#custom`:** property that uses the `command` value to run an app server and the `targetPort` value to connect to it. Required if `command` and `targetPort` are both set.
- **`https`:** property that specifies an SSL/TLS certificate and key file for the Netlify Dev local server. By default, Netlify Dev starts an HTTP server, but you can configure a certificate and key file if you require HTTPS. The `https` configuration is an object with the following properties:
  - **`certFile`:** path to the certificate file.
  - **`keyFile`:** path to the private key file.

Note that an **`environment`** property doesn't exist for `[dev]`. If you would like to set environment variables for use locally with the Netlify CLI, use [`context.dev`](/build/configure-builds/file-based-configuration#deploy-contexts) instead.

Here's an example `[dev]` section for Netlify Dev configuration overrides:

```toml
[dev]
  command = "yarn start"
  port = 8888
  targetPort = 3000
  publish = "dist"
  jwtRolePath = "app_metadata.authorization.roles"
  jwtSecret = "MY_JWT_SECRET_VALUE"
  autoLaunch = true
  framework = "#custom"
  [dev.https]
    certFile = "cert.pem"
    keyFile = "key.pem"
```

### Templates

While a template repository can make use of other `netlify.toml` settings, you can use the `[template]` section of a `netlify.toml` to provide template-specific configuration for [Deploy to Netlify buttons](/deploy/create-deploys#deploy-to-netlify-button).

```toml
[template]
  incoming-hooks = ["Contentful"]

[template.environment]
  SECRET_TOKEN = "change me for your secret token"
  CUSTOM_LOGO = "set the url to your custom logo here"
```

Visit our [template configuration](/deploy/create-deploys#template-configuration) docs to learn more about setting up templates and the configuration options in the example above.

## Inject environment variable values

Using environment variables directly as values in your `netlify.toml` isn't supported. For example, `key = "$VARIABLENAME"` will not inject `$VARIABLENAME`'s value into `netlify.toml`. One exception to this rule is [signed proxy redirects](/manage/routing/redirects/rewrites-proxies#signed-proxy-redirects).

For all other cases, you have two options for working with environment variable values in a file-based or programmatic way.

Note that if you have the option to set specific [scopes](/build/environment-variables/overview#scopes) for your environment variables, the scope must include **Builds** for the following options to work.

### Use a local build plugin

We recommend [creating a local build plugin](/extend/develop-and-share/develop-build-plugins#local-plugins) to use environment variable values in a programmatic way because it's the most versatile approach. It enables you to [read environment values](/extend/develop-and-share/develop-build-plugins#environment-variables) and change many aspects of your build configuration (including redirects and headers) through [the `netlifyConfig` object](/extend/develop-and-share/develop-build-plugins#netlifyconfig).

### Use the `[build]` command to substitute environment variable values

Substituting values using the `[build]` command in `netlify.toml` only works for the `[[headers]]` and `[[redirects]]` sections, as they are read after the build is complete. Note that substitutions made in the configuration file using this approach will not be available to build plugins, as build plugins run before the build command.

The [`[build]` command](/build/configure-builds/file-based-configuration/#build-settings) is a Bash command and so it has access to variables set in the build environment. You can use the following steps to substitute values in the file with environment variable values during the build step, **but only if you are changing headers or redirects**.

1. Add a placeholder like `HEADER_PLACEHOLDER` somewhere in the `[[headers]]` or `[[redirects]]` sections of your TOML file.
2. Create an environment variable, for example `PROD_API_LOCATION`, with the desired value in the Netlify UI.
3. Prepend a replacement `sed` command to your build command in `netlify.toml`. The `sed` command must use double quotation marks, not single ones. Here's an example for a site using `yarn build` to build:

   ```toml
   [build]
   command = "sed -i \"s|HEADER_PLACEHOLDER|${PROD_API_LOCATION}|g\" netlify.toml && yarn build"
   ```

## Sample `netlify.toml` file

This example `netlify.toml` demonstrates how you can combine multiple settings in a single file. It's not a comprehensive example of all available configuration options.

```toml
# Settings for the [build] key are global and are applied to
# all deploy contexts unless overridden by a context-specific setting.
[build]
  # Directory where the build system installs dependencies
  # and runs your build. Store your package.json, .nvmrc, etc here.
  # If not set, defaults to the root directory.
  base = "project/"

  # Directory that contains the deploy-ready HTML files and
  # assets generated by the build. This is an absolute path relative 
  # to the base directory, which is the root by default (/).
  # This sample publishes the directory located at the absolute 
  # path "root/project/build-output"

  publish = "build-output/"

  # Default build command.
  command = "echo 'default context'"

[[plugins]]
  # Installs the Lighthouse Build Plugin for all deploy contexts
  package = "@netlify/plugin-lighthouse"

# Production context: all deploys from the Production branch
# set in your site's Branches settings in the UI will inherit
# these settings. You can define environment variables
# here but we recommend using the Netlify UI for sensitive
# values to keep them out of your source repository.
[context.production]
  publish = "output/"
  command = "make publish"
  environment = { NODE_VERSION = "14.15.3" }

# Deploy Preview context: all deploys generated from
# a pull/merge request will inherit these settings.
[context.deploy-preview]
  publish = "dist/"

# Here is an example of how to define context-specific
# environment variables. To avoid committing sensitive
# values to public source repositories, set variables
# with the Netlify UI, CLI, or API instead.
[context.deploy-preview.environment]
  NOT_PRIVATE_ITEM = "not so secret"

# Branch Deploy context: all deploys that are not from
# a pull/merge request or from the Production branch
# will inherit these settings.
[context.branch-deploy]
  command = "echo branch"
[context.branch-deploy.environment]
  NODE_ENV = "development"

# Dev context: environment variables set here
# are available for local development environments
# run using Netlify Dev. These values can be
# overwritten on branches that have a more specific
# branch context configured.
[context.dev.environment]
  NODE_ENV = "development"

# Specific branch context: all deploys from
# this specific branch will inherit these settings.
[context.staging] # "staging" is a branch name
  command = "echo 'staging'"
  base = "staging"

# For contexts of branches with special characters,
# enclose the branch name with quotes.
[context."feat/branch"]
  command = "echo 'special branch'"
  base = "branch"

# Redirects and headers are GLOBAL for all builds - they do not
# get scoped to contexts no matter where you define them in the file.
# For context-specific rules, use _headers or _redirects files,
# which are PER-DEPLOY.

# A basic redirect rule
[[redirects]]
  from = "/*"
  to = "/blog/:splat"

# A redirect rule with many of the supported properties
[[redirects]]
  from = "/old-path"
  to = "/new-path"

  # The default HTTP status code is 301, but you can
  # define a different one.
  status = 302

  # By default, redirects won't be applied if there's a file
  # with the same path as the one defined in the `from` property.
  # Setting `force` to `true` will make the redirect rule
  # take precedence over any existing files.
  force = true

  # Redirect from /old-path?id=123 to /new-path.
  # Each combination of query params needs to be
  # defined in a separate [[redirects]] block.
  # More information at https://docs.netlify.com/manage/routing/redirects/redirect-options/#query-parameters
  query = {id = ":id"}

  # Redirect based on conditions including browser language,
  # geolocation, identity role, and/or cookie presence.
  conditions = {Language = ["en"], Country = ["US"]}

  # Sign each request with a value defined in an environment variable
  signed = "API_SIGNATURE_TOKEN"

  # You can also define custom headers within your redirects blocks.
  [redirects.headers]
    X-From = "Netlify"
    X-Api-Key = "some-api-key-string"

# Redirects for role-based access control don't use the 'to' property.
[[redirects]]
  from = "/gated-path"
  status = 200
  conditions = {Role = ["admin"]}
  force = true

# The following redirect is intended for use with most SPAs
# that handle routing internally.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  # Define which paths this specific [[headers]] block will cover.
  for = "/*"

  [headers.values]
    X-Frame-Options = "DENY"
    Content-Security-Policy = "frame-ancestors https://www.facebook.com"

    # Multi-value headers are expressed with multi-line strings.
  cache-control = '''
  max-age=0,
  no-cache,
  no-store,
  must-revalidate'''

    # Basic-Auth allows you to password protect your whole site.
    # This feature may not be available on all plans.
    Basic-Auth = "someuser:somepassword anotheruser:anotherpassword"

[functions]
  # Directory with serverless functions, including background
  # functions, to deploy. This is an absolute path relative to the 
  # base directory, which is the root by default (/).
  directory = "functions/"

# Use [dev] to set configuration overrides for local
# development environments run using Netlify Dev - except
# for environment variables. Environment variables for Netlify
# Dev should be set under [context.dev.environment] instead.
[dev]
  command = "yarn start"
  port = 8888
  publish = "dist"

```

---
title: "Optional configuration for functions"
description: "Learn about optional configuration settings you can use for more control over how your functions are built, deployed, and executed."
---

This document describes optional configuration settings you can use for more control over how your functions are built, deployed, and executed.

## Facet Switcher

Select your function language:

### Available Tabs:

#### TypeScript Tab

## Directory

Netlify will access the functions directory during every build, preparing and deploying each supported code file as a function. The default directory is `YOUR_BASE_DIRECTORY/netlify/functions`. You can customize the directory using the Netlify UI or file-based configuration.

- In the Netlify UI, go to 
### NavigationPath Component:

Project configuration > Build & deploy > Continuous deployment > Build settings
 and select **Configure**. In the **Functions directory** field, enter a path to the directory in your repository where you want to store your functions.

![](/images/functions-folder-setting.png)

- Alternatively, add the following to `netlify.toml` for [file-based configuration](/build/configure-builds/file-based-configuration/).

```toml
[functions]
  directory = "my_functions"
```

Settings in `netlify.toml` override settings in the Netlify UI.

For both methods, the path is an absolute path relative to the site's [base directory](/build/configure-builds/overview/#definitions-1) in your repository. To help keep your site secure, make sure your functions directory is outside of your [publish directory](/build/configure-builds/overview/#definitions-1) so that your source files aren't deployed as part of your site.

## Region

> **Pricing Information:** This feature is available on all [Pro](https://www.netlify.com/pricing/?category=developer) and [Enterprise](https://www.netlify.com/pricing/?category=enterprise) plans.

Netlify offers several [AWS regions](https://docs.aws.amazon.com/general/latest/gr/lambda-service.html) for deploying your serverless functions. You may want to customize the region for the following reasons:

- **Optimize performance.** Deploying serverless functions close to their data sources, such as a database or another backend service, can greatly reduce roundtrip time for data retrieval resulting in faster response times for your users.
- **Ensure compliance.** In some cases, data protection laws and industry-specific regulations may require that sensitive data processing happens within specific regions. 
- **Use Private Connectivity.** Static IP addresses for [Private Connectivity](/manage/security/private-connectivity/) are available in only some regions.  

By default, Netlify deploys functions for new sites to `us-east-2` (Ohio). This is a common choice for many database providers, so this optimizes performance for most cases.

You can change the region through the Netlify UI to one of the following regions.
- ap-northeast-1 - Asia Pacific (Tokyo)
- ap-southeast-1 - Asia Pacific (Singapore)
- ap-southeast-2 - Asia Pacific (Sydney)
- ca-central-1 - Canada (Central)
- eu-central-1 - EU (Frankfurt)
- eu-west-1 - EU (Ireland)
- eu-west-2 - EU (London)
- sa-east-1 - South America (São Paulo)
- us-east-1 - US East (N. Virginia)
- us-east-2 - US East (Ohio)
- us-west-1 - US West (N. California)
- us-west-2 - US West (Oregon)

In addition to the above self-serve regions, the following regions are available through support-assisted configuration.
- eu-west-3 - EU (Paris)
- eu-south-1 - EU (Milan)

If you want your site to use one of the above regions, please  [contact support](https://www.netlify.com/support/).

To configure your functions region through the Netlify UI:
1. Go to 
### NavigationPath Component:

Project configuration > Build & deploy > Continuous deployment > Functions region
.
1. Select **Configure**.
1. Use the menu to select a new region.
1. Confirm with **Save**.
1. Redeploy your site to apply the new region configuration.

Old deploys will continue to use the region configuration from when they were deployed.

## Bundle

For granular control over which files are bundled in your executable function artifacts, use the `netlify.toml` properties `external_node_modules` and `included_files`. Visit the [file-based configuration](/build/configure-builds/file-based-configuration/#functions) doc for details. 

```toml title="toml"
[functions]

  # Flags "package-1" as an external node module for all functions.
  external_node_modules = ["package-1"]

  # Includes all Markdown files inside the "files/" directory.
  included_files = ["files/*.md"]
```

## Node.js version for runtime

For all Node.js functions deployed on or after May 15, 2023, the default functions runtime is based on the [Node.js version used for the build](/build/configure-builds/manage-dependencies/#node-js-and-javascript). The Node.js version used for the build must be a valid [AWS Lambda runtime for Node.js](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html) that isn't set to be deprecated in the next two months.

If the build uses a version of Node.js that does not meet these conditions, then the functions runtime uses a fallback default version of Node.js 22.

You can override the default to any valid [AWS Lambda runtime for Node.js](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html) that isn't set to be deprecated in the next two months. Do so by completing the following steps.

1. In the Netlify UI, [set the environment variable](/build/environment-variables/get-started/#create-variables-with-the-netlify-ui-cli-or-api) `AWS_LAMBDA_JS_RUNTIME` to the desired version. For example, to use Node.js 20 for all future functions deployed, set the variable value to `nodejs20.x`.

2. Redeploy your site to apply the new runtime version. 

Note that this environment variable must be set using the Netlify UI, CLI, or API, and not with a Netlify configuration file (`netlify.toml`).

#### JavaScript Tab

## Directory

Netlify will access the functions directory during every build, preparing and deploying each supported code file as a function. The default directory is `YOUR_BASE_DIRECTORY/netlify/functions`. You can customize the directory using the Netlify UI or file-based configuration.

- In the Netlify UI, go to 
### NavigationPath Component:

Project configuration > Build & deploy > Continuous deployment > Build settings
 and select **Configure**. In the **Functions directory** field, enter a path to the directory in your repository where you want to store your functions.

![](/images/functions-folder-setting.png)

- Alternatively, add the following to `netlify.toml` for [file-based configuration](/build/configure-builds/file-based-configuration/).

```toml
[functions]
  directory = "my_functions"
```

Settings in `netlify.toml` override settings in the Netlify UI.

For both methods, the path is an absolute path relative to the site's [base directory](/build/configure-builds/overview/#definitions-1) in your repository. To help keep your site secure, make sure your functions directory is outside of your [publish directory](/build/configure-builds/overview/#definitions-1) so that your source files aren't deployed as part of your site.

## Region

> **Pricing Information:** This feature is available on all [Pro](https://www.netlify.com/pricing/?category=developer) and [Enterprise](https://www.netlify.com/pricing/?category=enterprise) plans.

Netlify offers several [AWS regions](https://docs.aws.amazon.com/general/latest/gr/lambda-service.html) for deploying your serverless functions. You may want to customize the region for the following reasons:

- **Optimize performance.** Deploying serverless functions close to their data sources, such as a database or another backend service, can greatly reduce roundtrip time for data retrieval resulting in faster response times for your users.
- **Ensure compliance.** In some cases, data protection laws and industry-specific regulations may require that sensitive data processing happens within specific regions. 
- **Use Private Connectivity.** Static IP addresses for [Private Connectivity](/manage/security/private-connectivity/) are available in only some regions.  

By default, Netlify deploys functions for new sites to `us-east-2` (Ohio). This is a common choice for many database providers, so this optimizes performance for most cases.

You can change the region through the Netlify UI to one of the following regions.
- ap-northeast-1 - Asia Pacific (Tokyo)
- ap-southeast-1 - Asia Pacific (Singapore)
- ap-southeast-2 - Asia Pacific (Sydney)
- ca-central-1 - Canada (Central)
- eu-central-1 - EU (Frankfurt)
- eu-west-2 - EU (London)
- sa-east-1 - South America (São Paulo)
- us-east-1 - US East (N. Virginia)
- us-east-2 - US East (Ohio)
- us-west-1 - US West (N. California)
- us-west-2 - US West (Oregon)

In addition to the above self-serve regions, the following regions are available through support-assisted configuration.
- eu-west-3 - EU (Paris)
- eu-south-1 - EU (Milan)

If you want your site to use one of the above regions, please  [contact support](https://www.netlify.com/support/).

To configure your functions region through the Netlify UI:
1. Go to 
### NavigationPath Component:

Project configuration > Build & deploy > Continuous deployment > Functions region
.
1. Select **Configure**.
1. Use the menu to select a new region.
1. Confirm with **Save**.
1. Redeploy your site to apply the new region configuration.

Old deploys will continue to use the region configuration from when they were deployed.

## Bundle

To optimize bundling time and artifact size, you can have Netlify use [esbuild](https://esbuild.github.io/) for bundling your JavaScript functions. Enable this in [`netlify.toml`](/build/configure-builds/file-based-configuration).

```toml
[functions]
  node_bundler = "esbuild"
```

For granular control over which files are bundled in your executable function artifacts, use the `netlify.toml` properties `external_node_modules` and `included_files`. Visit the [file-based configuration](/build/configure-builds/file-based-configuration/#functions) doc for details. 

```toml title="toml"
[functions]

  # Flags "package-1" as an external node module for all functions.
  external_node_modules = ["package-1"]

  # Includes all Markdown files inside the "files/" directory.
  included_files = ["files/*.md"]
```

## Node.js version for runtime

For all Node.js functions deployed on or after May 15, 2023, the default functions runtime is based on the [Node.js version used for the build](/build/configure-builds/manage-dependencies/#node-js-and-javascript). The Node.js version used for the build must be a valid [AWS Lambda runtime for Node.js](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html) that isn't set to be deprecated in the next two months.

If the build uses a version of Node.js that does not meet these conditions, then the functions runtime uses a fallback default version of Node.js 22.

You can override the default to any valid [AWS Lambda runtime for Node.js](https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html) that isn't set to be deprecated in the next two months. Do so by completing the following steps.

1. In the Netlify UI, [set the environment variable](/build/environment-variables/get-started/#create-variables-with-the-netlify-ui-cli-or-api) `AWS_LAMBDA_JS_RUNTIME` to the desired version. For example, to use Node.js 20 for all future functions deployed, set the variable value to `nodejs20.x`.

2. Redeploy your site to apply the new runtime version. 

Note that this environment variable must be set using the Netlify UI, CLI, or API, and not with a Netlify configuration file (`netlify.toml`).

#### Go Tab

## Directory

Netlify will access the functions directory during every build, preparing and deploying each supported code file as a function. The default directory is `YOUR_BASE_DIRECTORY/netlify/functions`. You can customize the directory using the Netlify UI or file-based configuration.

- In the Netlify UI, go to 
### NavigationPath Component:

Project configuration > Build & deploy > Continuous deployment > Build settings
 and select **Configure**. In the **Functions directory** field, enter a path to the directory in your repository where you want to store your functions.

![](/images/functions-folder-setting.png)

- Alternatively, add the following to `netlify.toml` for [file-based configuration](/build/configure-builds/file-based-configuration/).

```toml
[functions]
  directory = "my_functions"
```

Settings in `netlify.toml` override settings in the Netlify UI.

For both methods, the path is an absolute path relative to the site's [base directory](/build/configure-builds/overview/#definitions-1) in your repository. To help keep your site secure, make sure your functions directory is outside of your [publish directory](/build/configure-builds/overview/#definitions-1) so that your source files aren't deployed as part of your site.

## Region

> **Pricing Information:** This feature is available on all [Pro](https://www.netlify.com/pricing/?category=developer) and [Enterprise](https://www.netlify.com/pricing/?category=enterprise) plans.

Netlify offers several [AWS regions](https://docs.aws.amazon.com/general/latest/gr/lambda-service.html) for deploying your serverless functions. You may want to customize the region for the following reasons:

- **Optimize performance.** Deploying serverless functions close to their data sources, such as a database or another backend service, can greatly reduce roundtrip time for data retrieval resulting in faster response times for your users.
- **Ensure compliance.** In some cases, data protection laws and industry-specific regulations may require that sensitive data processing happens within specific regions. 
- **Use Private Connectivity.** Static IP addresses for [Private Connectivity](/manage/security/private-connectivity/) are available in only some regions.  

By default, Netlify deploys functions for new sites to `us-east-2` (Ohio). This is a common choice for many database providers, so this optimizes performance for most cases.

You can change the region through the Netlify UI to one of the following regions.
- ap-northeast-1 - Asia Pacific (Tokyo)
- ap-southeast-1 - Asia Pacific (Singapore)
- ap-southeast-2 - Asia Pacific (Sydney)
- ca-central-1 - Canada (Central)
- eu-central-1 - EU (Frankfurt)
- eu-west-2 - EU (London)
- sa-east-1 - South America (São Paulo)
- us-east-1 - US East (N. Virginia)
- us-east-2 - US East (Ohio)
- us-west-1 - US West (N. California)
- us-west-2 - US West (Oregon)

In addition to the above self-serve regions, the following regions are available through support-assisted configuration.
- eu-west-3 - EU (Paris)
- eu-south-1 - EU (Milan)

If you want your site to use one of the above regions, please  [contact support](https://www.netlify.com/support/).

To configure your functions region through the Netlify UI:
1. Go to 
### NavigationPath Component:

Project configuration > Build & deploy > Continuous deployment > Functions region
.
1. Select **Configure**.
1. Use the menu to select a new region.
1. Confirm with **Save**.
1. Redeploy your site to apply the new region configuration.

Old deploys will continue to use the region configuration from when they were deployed.

## Go version for builds

The Go version used in the deployment pipeline is determined by your site's [build image](/build/configure-builds/overview#build-image-selection). 

To modify the Go version used for your builds, change the build image for your site at 
### NavigationPath Component:

Project configuration > Build & deploy > Continuous Deployment > Build image selection
.

