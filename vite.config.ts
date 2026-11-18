import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function emitStaticRouteHtmlPlugin(): Plugin {
  return {
    name: 'emit-static-route-html',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) return;

      const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');

      const routes: Array<{
        slug: string;
        title: string;
        description: string;
        noscriptHtml: string;
      }> = [
        {
          slug: 'delete-account',
          title: 'Delete Account - Rathore Rishtey',
          description:
            'Official account and data deletion instructions for Rathore Rishtey. Delete instantly in-app via Settings > Account > Delete Account or email abhiruchirathore97@gmail.com.',
          noscriptHtml:
            '<noscript><main style="max-width:720px;margin:40px auto;font-family:sans-serif;padding:0 16px;line-height:1.6"><h1>Rathore Rishtey — Delete Your Account</h1><h2>In-App Method</h2><p>Log in to the Rathore Rishtey app, go to Settings &gt; Account &gt; Delete Account to permanently delete your data instantly.</p><h2>Email Request Method</h2><p>If you cannot access the app, email our support team at abhiruchirathore97@gmail.com with the subject &quot;Delete Account Request&quot;, and we will process your deletion within 7 days.</p><h2>What Gets Deleted &amp; Data Retention</h2><p>Deleting your account permanently removes your profile and matrimonial biodata, business listings, chat messages, uploaded photos and media assets, likes, blocked list, and login credentials. No personal profile, photo, or chat data is retained. Minimal billing invoices (if any paid transaction occurred) and restricted anti-fraud security logs may be retained only as required by law for up to 90 days (or statutory tax audit periods) before permanent deletion.</p></main></noscript>'
        },
        {
          slug: 'privacy-policy',
          title: 'Privacy Policy - Rathore Rishtey',
          description:
            'Privacy Policy for Rathore Rishtey digital matrimony biodata directory and community portal.',
          noscriptHtml: ''
        }
      ];

      for (const route of routes) {
        let routeHtml = baseHtml
          .replace(/<title>.*?<\/title>/i, `<title>${route.title}</title>`)
          .replace(
            /<meta name="description" content="[^"]*"\s*\/?>/i,
            `<meta name="description" content="${route.description}" />`
          )
          .replace(
            /<meta property="og:title" content="[^"]*"\s*\/?>/i,
            `<meta property="og:title" content="${route.title}" />`
          )
          .replace(
            /<meta property="og:description" content="[^"]*"\s*\/?>/i,
            `<meta property="og:description" content="${route.description}" />`
          );

        if (route.noscriptHtml) {
          routeHtml = routeHtml.replace('<div id="root"></div>', `<div id="root"></div>${route.noscriptHtml}`);
        }

        const routeDir = path.join(distDir, route.slug);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.writeFileSync(path.join(routeDir, 'index.html'), routeHtml, 'utf8');
        fs.writeFileSync(path.join(distDir, `${route.slug}.html`), routeHtml, 'utf8');
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), emitStaticRouteHtmlPlugin()],
  resolve: {
    dedupe: [
      'firebase',
      '@firebase/app',
      '@firebase/auth',
      '@firebase/firestore',
      '@firebase/component',
      '@firebase/util',
    ],
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
