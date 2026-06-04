Netlify Blobs provide a powerful way to read and write unstructured data in a key-value format. Because the value of a blob can be any type of data, we can use blobs beyond typical KV store scenarios.

## TL;DR

We're going to walk through the basics of using Netlify Blobs to allow users to upload images to your site. After we cover the basic steps, we'll talk more specifically about how this applies to the example site.

<Callout title="Demo time!">

This guide walks through the general process with loose references to the demo site. If you'd like to see the full code, visit [our examples repository](https://github.com/netlify/examples/tree/main/examples/user-image-uploads-astro-blobs).

Or you can deploy the demo site to your own Netlify account by clicking the button below.

<DTNButton repo="https://github.com/netlify/examples/&create_from_path=examples/user-image-uploads-astro-blobs&utm_campaign=dx-examples" />

</Callout>

## Applying to any framework

Technically, this pattern can be accomplished using static HTML files and Netlify Functions.

Because of that, there is no specific framework (or set of frameworks) for which this guide is intended. You can take the principles and apply them to any framework you choose.

## Requirements

There are two requirements for this guide:

- Install `@netlify/blobs` to be able to access the Netlify Blobs API from your code.
- Use [Netlify Dev](https://docs.netlify.com/cli/local-development/) to ensure that the serverless functions and blobs store work in your local development environment.

## Uploading images to Netlify Blobs

First, let's build the process for uploading a file and storing it in a Netlify Blob.

### Upload file form

On the page where the user can upload an image, add a form to upload a file. The form should include an input field of type `file` and a submit button.

```html
<form action="/upload" method="post" enctype="multipart/form-data">
  <input type="file" name="fileUpload" accept="image/*" style="margin-top: 1rem;" />
  <div>
    <input type="submit" value="Upload avatar" />
  </div>
</form>
```

Notice that the form's `action` is `/upload`. This is where we'll send the file to be processed.

### The upload endpoint

Add your endpoint file to handle the `POST` request to `/upload`. Without a framework, this can be done with a serverless function and a redirect, where `/upload` redirects to `/.netlify/functions/<your-function-name>`.

Here is the basic shape to a function that handles the file upload:

```ts
import { getStore } from "@netlify/blobs";

export async function uploadEndpoint({ request }) {
  // Get form data from the request (assumes that `request` is the incoming
  // request object)
  const formData = await request.formData();
  // Get the file from the form data
  const fileUpload = formData.get("fileUpload") as File;
  // Load the Netlify Blobs store called `UserUpload`
  const userUploadStore = getStore({ name: "UserUpload", consistency: "strong" });
  // Set the file in the store. Replace `<key>` with a unique key for the file.
  await userUploadStore.set("<key>", fileUpload);
  // Redirect to a new page
  return redirect("<redirect_path>");
}
```

A few notes about the function above:

- Each blobs store has a name. This is typically used to group blobs together.
- The `consistency` option is set to `"strong"`. Blobs use eventual consistency by default. We set it to strong so that the upload is immediately available when replacing the image under the same key.
- The `<key>` in the `set` method should be a unique identifier for the file. This could be a UUID or a hash of the file contents. It should be a value by which you can retrieve the file later.

## Displaying the image

To display the image, we take a similar approach. We can use a server-side function to retrieve the image and serve it to the client.

### Retrieval function

Similar to uploading, you can add another function or endpoint for retrieving the image. This function will read the blob from the store and return it to the client.

```ts
import { getStore } from "@netlify/blobs";

export async function uploadEndpoint() {
  // Load the Netlify Blobs store called `UserUpload`
  const userUploadStore = getStore({ name: "UserUpload", consistency: "strong" });
  // Get the blob from the store. Replace `<key>` with the unique key used when
  // uploading.
  const userUploadBlob = await userUploadStore.get("<key>", {
    type: "stream",
  });
  // Make sure you throw a 404 if the blob is not found.
  if (!userUploadBlob) {
    return new Response("Upload not found", { status: 404 });
  }
  // Return the blob
  return new Response(userUploadBlob);
}
```

### Handling dynamic paths

In most cases, you won't be hard-coding the key for the image upload in the function. Instead, you'll likely want to get this through GET parameters or some other dynamic method, depending on the framework you're using.

### Image markup

Because this function returns the image as a stream, you can use it directly in an `img` tag.

```html
<img src="<path-to-function>" alt="<alt-text>" />
```

### Using JS for a fallback

If you're using the image tag, you want to ensure you have some confidence that the image exists. Otherwise, you'll render a broken image.

A common pattern is to have a reference to the image in your data store to ensure it's there, and then conditionally render the image.

But that isn't always a practical approach. Fortunately, you can use just a bit of JavaScript to add a class to the image if it fails to load.

```html
<img src="<path-to-function>" class="my-image" onerror="this.classList.add('missing-upload')" />
```

## User-generated uploads for avatar images

That's it! This is a basic and generic pattern for uploading and displaying images using Netlify Blobs. You can extend this pattern to any scenario where you need to store and retrieve images.

The [example application](https://github.com/netlify/examples/tree/main/examples/user-image-uploads-astro-blobs) is an Astro site that allows users to upload an avatar image. The application includes a mock authentication service to simulate the user's identity.

Let's wrap up by briefly looking at how the example project works.

### Mock auth service

A mock authentication service simulates the user's identity with this flow:

1. The app has a `/profile` page that does not show any information when the user is not authenticated, but provides a link to the `/login` page.
2. Visiting the `/login` page looks for the current user. If it doesn't find one, it mocks a user by creating a random email, name, and ID value.
3. The user's information is stored in a server cookie.
4. The `/profile` page then reads the cookie to determine if the user is authenticated.

### Uploading avatar images

Once a user is authenticated, they can access the upload form on the `/profile` page. The form follows the pattern above by sending a `POST` request to an `/upload-avatar` endpoint.

The endpoint gets transformed into a serverless function during the build. It uses the `@netlify/blobs` package to store the image in a blobs store, and uses the user ID value as the key for the image.

### Displaying the avatar

In the example, we only display the current user's avatar. For that reason, we have a single `/avatar` endpoint that is responsible for retrieving the image. It uses the current user's ID to retrieve the image from the blobs store.

Then, anywhere on the site, we can show the user's avatar by using the `/avatar` endpoint as the `src` value.

```html
<img src="/avatar" class="avatar" onerror="this.parentElement.classList.add('missing-upload')" />
```

Notice that if the image is missing, this code adds a class to the parent element. This is used to style the image differently if it is missing.

## Apply this to your site!

Now that you understand how the reading and writing mechanisms work, you can extend this pattern to any scenario you can dream of!