import dotenv from 'dotenv';
import { resolve } from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Cargar .env y .env.local
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: true });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('--- TEST DE CONEXIÓN CLOUDINARY ---');
console.log('Cloud Name :', cloudName ? `✅ ${cloudName}` : '❌ NO DEFINIDO');
console.log('API Key    :', apiKey ? `✅ ${apiKey.slice(0, 4)}...` : '❌ NO DEFINIDO');
console.log('API Secret :', (!apiSecret || apiSecret === 'TU_API_SECRET') 
  ? '⚠️ PENDIENTE (contiene "TU_API_SECRET" o está vacío)' 
  : `✅ Configurado (${apiSecret.slice(0, 3)}...${apiSecret.slice(-3)})`
);

if (!cloudName || !apiKey || !apiSecret || apiSecret === 'TU_API_SECRET') {
  console.log('\n[INFO] Por favor edita .env.local y coloca tu API Secret real.');
  process.exit(0);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

try {
  const res = await cloudinary.api.ping();
  console.log('\n[ÉXITO] Conexión establecida con Cloudinary:', res);
} catch (error) {
  console.error('\n[ERROR] Falló la verificación con Cloudinary:', error.message || error);
}
