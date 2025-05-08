# Next.js + Shadcn UI Template

This is a template for a Next.js project using Shadcn UI.

## What's included?

- Next.js
- Shadcn UI
- Tailwind CSS
- TypeScript
- Lucide Icons

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/font) to optimize and load Inter, a custom Google Font.

## Learnings

Here are some details that I learned while building this project. I hope that these details
 matters.
1. Default
2. Error
3. Warning
4. Info
5. Success

To change how long these toasts last, change the `duration` property of the toast.

You can add custom actions using the `action` prop. You can also use your own components with the `ToastProvider`.

```tsx
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
```

## React Hot Toast
The useToast hook is inspired by React Hot Toast. React Hot Toast is an amazing library.

Check it out here: [https://react-hot-toast.com/](https://react-hot-toast.com/)

## Credits
* [Shadcn](https://twitter.com/shadcn)
* [Radix UI](https://www.radix-ui.com/)
* [Vercel](https://vercel.com)
* [React Hot Toast](https://react-hot-toast.com/)
* [Tailwind CSS](https://tailwindcss.com/)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## AI Hints

When generating new components for this app, here are some details to keep in mind.

For example, you can add a button with the `Button` component.

```tsx
import { Button } from "@/components/ui/button"

<Button>My Button</Button>
```

The Shadcn CLI is available, so you can run commands to generate new components.

For example, you can run the following to generate a new `Input` component:

```bash
npx shadcn-ui@latest add input
```

The components are stored in the `components/ui` directory.

When building this app, keep in mind that it uses TypeScript and RSCs.

Refer to the [Shadcn UI](https://ui.shadcn.com/) documentation for more details.

## Next.js App Router

The Next.js App Router provides a new way to structure your Next.js applications.

By default, components are server components, unless you specify `'use client'` at the top of your component.

Read more here: [https://nextjs.org/docs/app](https://nextjs.org/docs/app)

## Tailwind CSS
The project uses Tailwind CSS. The config is located at `tailwind.config.js` and the CSS variables are in `src/app/globals.css`.

Read more here: [https://tailwindcss.com/](https://tailwindcss.com/)

## React
This app uses React 18, which means that you can use the latest React features.

- Server components
- Client components
- Suspense

Read more here: [https://react.dev/](https://react.dev/)

## Lucide Icons
This app uses Lucide Icons.

To add new icons, use the `lucide-react` package. For example, if you want to use the `Home` icon:

```tsx
import { Home } from "lucide-react"

<Home />
```

If you want to use a different size or color, you can pass props to the icon:

```tsx
import { Home } from "lucide-react"

<Home size={48} color="red" />
```

If you're not sure which icons are available, you can check out the [Lucide website](https://lucide.dev/).

Make sure to use the correct name for the icon. For example, if you want to use the `Home` icon, use `Home` and not `home`.
Also, make sure that the icon actually exists. For example, there is no `Tooth` or `Alarm` icon in `lucide-react`.

The `lucide-react` package is already installed.

Read more here: [https://lucide.dev/guide/packages/lucide-react](https://lucide.dev/guide/packages/lucide-react)
