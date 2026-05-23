import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function update() {
  const { saveWhatsAppSettings } = await import('./apps/web/src/app/actions/whatsapp');
  console.log("Updating WhatsApp token in database...");
  const res = await saveWhatsAppSettings(
    '1167527226439884',
    'EAASjCmp8doEBRovsrR2ioB40kQNarZCfby6SnN5c6CitDkzzGojmLmoLWZBtpBuWbW864Jtg78Wc5wYkMcsJsB1ACDSsCsZADyZCLONwwvlq8xlzPvd57KhyateKoWEjeVxsHC2hmBQOiGPUa5TXCuM5uAPtZAjEulZAGPAGV8ZCjTOarpAM7Djmz76mHv3elVGO3ysS7B8OaLM8BttNZC62yEUfeExZCLiG2QUMfr1MHylyZCZASwDeM30lrPZA1PVr1tRCYvAuJ6PJLwaT2D1OvEFeZAPjdWVyxqjcZD',
    true // enabled
  );
  console.log("Result:", res);
}

update();
