/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{ protocol: 'https', hostname: '**' }],
    },
    // firebase-admin uses native modules — don't bundle, load from node_modules at runtime
    serverExternalPackages: ['firebase-admin', 'firebase-admin/app', 'firebase-admin/firestore'],
}

module.exports = nextConfig
