const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Index } = require('@upstash/vector');

// 1. Load environment variables
const searchPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../.env'),
];

for (const p of searchPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    console.log(`✅ Loaded environment variables dari: ${p}`);
    break;
  }
}

const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_VECTOR_REST_URL;
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_VECTOR_REST_TOKEN;

if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN) {
  console.error('❌ UPSTASH_VECTOR_REST_URL atau UPSTASH_VECTOR_REST_TOKEN tidak ditemukan.');
  process.exit(1);
}

const vectorIndex = new Index({
  url: UPSTASH_VECTOR_REST_URL,
  token: UPSTASH_VECTOR_REST_TOKEN,
});

// Deterministic 384-dim dense embedding generator
function generate384Embedding(text) {
  const dim = 384;
  const vec = [];
  for (let i = 0; i < dim; i++) {
    const hash = crypto.createHash('sha256').update(`${text}_${i}`).digest('hex');
    const val = (parseInt(hash.slice(0, 8), 16) / 0xffffffff) * 2.0 - 1.0;
    vec.push(val);
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1.0;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

async function run() {
  try {
    const info = await vectorIndex.info();
    console.log('✅ Koneksi Upstash Berhasil:', info);

    const kbPath = path.resolve(process.cwd(), 'public/data/knowledge-base.json');
    if (!fs.existsSync(kbPath)) {
      console.error('❌ File knowledge-base.json tidak ditemukan.');
      process.exit(1);
    }

    const docs = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
    console.log(`📦 Memulai upload ${docs.length} dokumen ke Upstash Vector...`);

    const batchSize = 100;
    let uploaded = 0;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(docs.length / batchSize);

      const payload = batch.map((doc) => ({
        id: doc.id,
        vector: generate384Embedding(doc.content),
        metadata: {
          content: doc.content,
          ...doc.metadata,
        },
      }));

      await vectorIndex.upsert(payload);
      uploaded += payload.length;
      console.log(`   ✅ Batch ${batchNum}/${totalBatches} berhasil (${payload.length} vektor)`);
    }

    console.log(`\n🎉 Selesai! ${uploaded} vektor berhasil diunggah.`);
  } catch (err) {
    console.error('❌ Error seeding:', err);
  }
}

run();
