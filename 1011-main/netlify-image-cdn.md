---
title: "Netlify Image CDN"
description: "Transform images on demand without impacting build times. Handle content negotiation automatically."
---

With Netlify Image CDN, you can transform images on demand without impacting build times. Netlify Image CDN also handles content negotiation to use the most efficient image format for the requesting client. Optimizing the size and format of your images improves both the runtime performance and reliability of your site. Transformations are integrated natively into the CDN so that repeated requests leverage layers of caching for improved performance.

To [transform an image](#transform-images), make a request to `/.netlify/images` with query parameters that specify the source asset and the desired transformations.

After an image is transformed, the result is uniquely cached on our edge and future requests for the same transformation will serve the cached asset. By default, Netlify Image CDN respects [atomic deploys](/build/caching/caching-overview#automatic-invalidation-with-atomic-deploys). If you change a previously transformed source image in a new deploy, we re-run transformations on new requests so that we don't serve outdated assets.

Many frameworks on Netlify use Netlify Image CDN to power image optimization and transformation. You can use Netlify Image CDN directly as described below or review our [framework support](#framework-support) details and benefit from Netlify Image CDN through your framework's built-in image handling.

## Transform images

Use query parameters on your requests to `/.netlify/images` to specify the following transformation options: 

- [source](#source)
- [size](#size)
- [fit](#fit)
- [position](#position)
- [format](#format)
- [quality](#quality)

You must specify a [source asset](#source) with the `url` parameter as described below. All other parameters are optional.

### Note - Query validation and response codes

When a request is made to `/.netlify/images`, we validate the query parameters.
- If any transformation parameters have invalid values, we return a `404`.
- If the query parameters are valid and the request is for a new transformation, we return a `200` with the requested content and content-type.
- If the request is for a previously transformed image, we return a `304`.

For interactive examples of the different parameters, visit our [demo site](https://image-cdn-playground.netlify.app/).

### Source

You must specify a source image with the `url` parameter. You can use either a [relative](#relative-path) or a [remote](#remote-path) path to your source image.

### Note - Source-only transformations

If you include only a source `url` in your transformation request, we don't change the size or shape of your image. But, we do transform the [format](#format) to `avif` or `webp` according to which formats are supported by the user's browser.

#### Relative path

No configuration is required for relative paths to source images.

Here's an example transformation request using a relative path to an image on the site's domain.

```bash
# transform the source image deployed at https://mysitename.netlify.app/owl.jpeg
curl -vs 'https://mysitename.netlify.app/.netlify/images?url=/owl.jpeg'
```

As mentioned above, Netlify Image CDN respects atomic deploys by default. If you change a previously transformed relative source image in a new deploy, we re-run transformations on new requests so that we don't serve outdated assets.

#### Remote path

To transform a source image hosted on another domain, you must first configure allowed domains in your `netlify.toml` file using the `images` key.

```toml
[images]
  remote_images = ["https://my-images.com/.*", "https://animals.more-images.com/[bcr]at/.*"]
```

The `remote_images` property accepts an array of regex. If your images are in specific subdomains or directories, you can use regex to allow just those subdomains or directories. Note that you need to double-escape regex in `netlify.toml` files. For example, the string `https://` can convert to a regex as `https:\/\/` but you should specify it in `netlify.toml` as `https:\\/\\/`. One way to double-escape regex is to use JavaScript's [`.toString()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/toString) RegExp method. 

After configuring allowed domains for remote images, you can request transformations of assets hosted on the allowed domains. Here's an example transformation request using a remote path to an image on another domain.

```bash
# transform the source image hosted at https://my-images.com/owl.jpeg
curl -vs 'https://mysitename.netlify.app/.netlify/images?url=https://my-images.com/owl.jpeg'
```

### Size

To change the size of an image, use the following parameters with integers to specify the target size in pixels.

- **`w`:** width
- **`h`:** height

```bash
# resize the image to 50 px wide
curl -vs 'https://mysitename.netlify.app/.netlify/images?url=/owl.jpeg&w=50'
```

How these parameters are applied depends on the [`fit`](#fit) option for the request. By default, [`fit=contain`](#fit-contain-default).

### Fit

To control how an image is resized, use the `fit` parameter. Supported values are as follows:

- [`contain`](#fit-contain-default) (default)
- [`cover`](#fit-cover)
- [`fill`](#fit-fill)

The `fit` parameter works in conjunction with the `w` and `h` [size](#size) parameters. The `fit` value affects things such as whether or not the aspect ratio is maintained and whether or not the requested dimensions are always returned.

```bash
# resize and crop the image to 50 pixels square
curl -vs 'https://mysitename.netlify.app/.netlify/images?url=/owl.jpeg&fit=cover&w=50&h=50'
```

Here's a comparison of the different `fit` options. They each behave in the same way as their equivalent [CSS `object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) values. For more information, including example images, read the option-specific sections below.

<div id="role-table-wrapper">

| `fit=`   | source aspect ratio always maintained | excess pixels cropped | requested dimensions always returned             |
|:---------|:--------------------------------------|:----------------------|:-------------------------------------------------|
| `contain`| yes                                   | no                    | no, one dimension may be smaller                 | 
| `cover`  | no                                    | yes                   | yes, image scaled proportionally before cropping |
| `fill`   | no                                    | no                    | yes, image stretched and squished if needed      |

</div>

#### `fit=contain` (default)

Fit within the specified dimensions and maintain the source aspect ratio by resizing the image proportionally. If you supply just one dimension, the other is calculated to maintain the aspect ratio of the source image. If you supply two dimensions and the target aspect ratio is different than the source aspect ratio, one dimension of the resulting image matches the requested size while the other is smaller. 

![Examples. Original image is 400 by 310. Contain width 600 and height 600 enlarges image proportionally to 600 by 465. Contain width 200 and height 400 shrinks image proportionally to 200 by 155.](/images/image-cdn-contain.png)

#### `fit=cover`

Fill the specified dimensions without distortion by resizing the image proportionally, then cropping out any excess pixels. By default, the center of the image is retained with the left and right or top and bottom cropped evenly. To control what part of the image is retained, use the [`position`](#position) parameter. 

To use `fit=cover`, you must supply both `w` and `h`. 

![Examples. Original image is 400 by 310. Cover width 200 and height 310 crops out excess pixels from left and right without resizing. Cover width 500 and height 150 enlarges image to new width then crops excess pixels from top and bottom. Cover width 150 and height 150 resizes image to new height then crops excess pixels from left and right.](/images/image-cdn-cover.png)

#### `fit=fill`

Fill the specified dimensions exactly. If the target aspect ratio is different than the source aspect ratio, the image is stretched and squished as needed to fill the target dimensions.

![Examples. Original image is 400 by 310. Images are distorted to fill new dimensions. Fill width 200 and height 400 stretches image vertically. Fill width 300 and height 100 squishes image vertically. Fill width 150 and height 150 slightly stretches image vertically.](/images/image-cdn-fill.png)

### Position

To control how an image is cropped when [`fit=cover`](#fit-cover), use the `position` parameter. Supported values are as follows:

- `top`
- `bottom`
- `left`
- `right`
- `center` (default)

The value represents what part of the image to retain when cropping. 

```bash
# resize the image and retain the left side when cropping
curl -vs 'https://mysitename.netlify.app/.netlify/images?url=/owl.jpeg&fit=cover&w=50&h=50&position=left'
```

### Format

To change the format of an image, use the `fm` parameter. Supported values are as follows:

- `avif`
- `jpg`
- `png`
- `webp` - can be static or animated.
- `gif` - can be static or animated.
- `blurhash` - returns a string that you can use to render a blurred placeholder image. Visit [BlurHash](https://blurha.sh) to learn more.

```bash
# convert a jpeg into png
curl -vs 'https://mysitename.netlify.app/.netlify/images?url=/owl.jpeg&fm=png'

# resulting image includes an appropriate `content-type` response header
< HTTP/2 200
< content-type: image/png
```

If you don't specify a format, we inspect the `Accept` header for content negotiation with the following logic:
1. use `webp` if accepted
2. otherwise, use `avif` if accepted
3. if neither is accepted, use the original format

### Quality

To control the output quality of a lossy conversion, use the `q` parameter. This applies when the target [format](#format) is `avif`, `jpg`, `gif`, or `webp`.

The `q` parameter supports whole integers from `1` to `100`. The default is `75`. 

```bash
# convert a jpeg into avif with medium quality
curl -vs 'https://mysitename.netlify.app/.netlify/images?url=/owl.jpeg&fm=avif&q=50'
```

## Redirects and rewrites

You can use [redirects and rewrites](/manage/routing/redirects/overview) with Netlify Image CDN. This can be helpful, for example, if you want to reuse the same parameters for multiple images.

### Tabs Component:

<TabItem label="_redirects">
```
/transform-small/* /.netlify/images?url=/:splat&w=50&h=50 200
```
</TabItem>

<TabItem label="netlify.toml">
```toml
[[redirects]]
  from = "/transform-small/*"
  to = "/.netlify/images?url=/:splat&w=50&h=50"
  status = 200
```
</TabItem>

With the above redirect in place, you can make transformation requests like the following:

```bash
# transform the source image deployed at https://mysitename.netlify.app/owl.jpeg
# to a size of 50px wide by 50px high per the parameters in the redirect
curl -vs 'https://mysitename.netlify.app/transform-small/owl.jpeg'
```

### Caution - Cross-site redirects are not recommended

Cross-site redirects for image transformations are not recommended. They could negatively impact your site's performance.

## Custom headers

You can use [custom headers](/manage/routing/headers) with Netlify Image CDN. This can be helpful, for example, if you want to customize [browser caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) behavior. 

You can apply custom headers to source images on the site's domain. It's not currently possible to apply custom headers from the site to source images hosted on another domain. However, Netlify will respect any cache headers an external domain sends with the source images.

Note that `Cache-Control` headers on source images only apply to browsers and CDNs in front of Netlify and not the Netlify Cache itself.

To use custom headers with Netlify Image CDN, apply header rules to your source images.

### Tabs Component:

<TabItem label="_headers">
```
/source-images/*
  Cache-Control: public, max-age=604800, must-revalidate
```
</TabItem>

<TabItem label="netlify.toml">
```toml
[[headers]]
  for = "/source-images/*"
  [headers.values]
    Cache-Control = "public, max-age=604800, must-revalidate"
```
</TabItem>

Headers you set for a source image are applied to the transformed and optimized assets served by Netlify Image CDN. 

For example, the above headers will apply when you make this transformation request:

```bash
# transform the source image deployed at https://mysitename.netlify.app/source-images/owl.jpeg
curl -vs 'https://mysitename.netlify.app/.netlify/images?url=/source-images/owl.jpeg'
```

## Local development

Use [Netlify Dev](/api-and-cli-guides/cli-guides/local-development) to test image transformations locally. This feature of the Netlify CLI runs a local development server that mimics the Netlify production environment, including Netlify Image CDN.

## Framework support

The following frameworks offer built-in image optimization tools that we support through integrations with Netlify Image CDN. You can use your framework's standard image handling syntax and get extra performance optimizations from Netlify Image CDN. For all other frameworks, you can use Netlify Image CDN directly as described above.

<div id="role-table-wrapper">

| Framework | Prerequisites | [Remote path](#remote-path) allowlist |
|---|---|---|
| [Angular](/build/frameworks/framework-setup-guides/angular#netlify-image-cdn) | None. `NgOptimizedImage` automatically uses Netlify Image CDN. | `[images] remote_images` in `netlify.toml` |
| [Astro](/build/frameworks/framework-setup-guides/astro#netlify-image-cdn) | None. Astro's `<Image />` component automatically uses Netlify Image CDN. | `image.domains` or `image.remotePatterns` in `astro.config.mjs` |
| [Gatsby 5.13 or later](/build/frameworks/framework-setup-guides/gatsby/#netlify-image-cdn) | Set environment variable `NETLIFY_IMAGE_CDN` to `true` and use the Contentful, Drupal, or WordPress source plugins. | `[images] remote_images` in `netlify.toml` |
| [Gatsby 5.11 or earlier](/build/frameworks/framework-setup-guides/gatsby/#netlify-image-cdn) | Set environment variable `NETLIFY_IMAGE_CDN` to `true` and use the Contentful, Drupal, or WordPress source plugins. | `[images] remote_images` in `netlify.toml` |
| [Next.js](/build/frameworks/framework-setup-guides/nextjs/overview) | If using Next.js 13.5 or later and Next.js adapter v5. | `remotePatterns` property in `next.config.js` |
| [Nuxt](/build/frameworks/framework-setup-guides/nuxt#netlify-image-cdn) | None. The `nuxt/image` module automatically uses Netlify Image CDN. | `image.domains` option in `nuxt.config.ts` |

</div>

## Limitations

Keep the following limitation in mind when working with Netlify Image CDN:

- [Split Testing](/manage/monitoring/split-testing/) is not supported. You may get inconsistent image results between your split test branches. 
- Netlify Image CDN is not currently supported as part of our HIPAA-compliant hosting offering. For more information, visit our [Trust Center](https://trust-center.netlify-corp.com) and download our reference architecture for HIPAA-compliant composable sites on Netlify.

