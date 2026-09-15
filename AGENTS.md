## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Code Generation Rules

Do not add stupid comments. For example, these are stupid comments.

```typescript
let x = [
    0, // 0th index
    45, // 1st index
];
```

Those kinds of comments are a waste of text and bog down reading comprehension. I.e., they are stupid comments. Don't do things like that. Only explain INTENT of a code block rather than what it's doing, unless it's something nontrivial.

Here is another example.

```typescript
// Helper to track placed tiles using a Set of tuples
type Tile = [number, number];
```

IT IS USELESS. DO NOT WRITE STUPID COMMENTS.
