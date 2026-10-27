This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Connect Noir Wallet on Zcash testnet

1. Install the official Noir Wallet testnet extension from the [Noir Wallet releases](https://github.com/NoirWallet/noir-wallet-sdk/releases). Use a release asset whose filename ends in `-testnet.zip`.
2. In Chrome, extract the ZIP, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked** to select the extracted extension folder.
3. Reload `http://localhost:3000` and choose **Connect wallet**. Zecrow accepts the connection only when Noir returns a Zcash testnet Unified Address.

This connection authorizes the site to read the selected account address. It does not yet create an authenticated user session or fund an escrow. Those require a server-verified signature challenge and a Zcash testnet payment watcher.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
