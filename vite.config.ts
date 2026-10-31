import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({plugins:[VitePWA({registerType:'autoUpdate',manifest:{name:'拾语 · English Grove',short_name:'拾语',description:'每天一点，英语慢慢生长',theme_color:'#194f43',background_color:'#f7f8f3',display:'standalone',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]},workbox:{globPatterns:['**/*.{js,css,html,svg}']}})]});
