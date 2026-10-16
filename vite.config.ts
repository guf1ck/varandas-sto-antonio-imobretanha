import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'/varandas-sto-antonio-imobretanha/',plugins:[react()],build:{chunkSizeWarningLimit:1500}});
