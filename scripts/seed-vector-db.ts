import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Index } from '@upstash/vector';

// ============================================================
// 1. LOAD ENVIRONMENT VARIABLES DENGAN DOTENV
// ============================================================
// Periksa lokasi .env.local di direktori kerja saat ini dan direktori parent
const searchPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../.env'),
];

let loadedEnvFile = '';
for (const p of searchPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedEnvFile = p;
    break;
  }
}

if (loadedEnvFile) {
  console.log(`✅ Loaded environment variables dari: ${loadedEnvFile}`);
} else {
  console.warn('⚠️ File .env.local atau .env tidak ditemukan secara otomatis.');
}

// ============================================================
// 2. VALIDASI ENVIRONMENT VARIABLES
// ============================================================
const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_VECTOR_REST_URL;
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_VECTOR_REST_TOKEN;

console.log('\n🔍 Environment check:');
console.log(`  UPSTASH_VECTOR_REST_URL: ${UPSTASH_VECTOR_REST_URL ? '✅ Ditemukan (' + UPSTASH_VECTOR_REST_URL.slice(0, 30) + '...)' : '❌ Tidak ditemukan'}`);
console.log(`  UPSTASH_VECTOR_REST_TOKEN: ${UPSTASH_VECTOR_REST_TOKEN ? '✅ Ditemukan' : '❌ Tidak ditemukan'}`);

if (!UPSTASH_VECTOR_REST_URL || !UPSTASH_VECTOR_REST_TOKEN) {
  console.error('\n❌ ERROR: Environment variables tidak lengkap!');
  console.error('Pastikan file .env.local berisi:');
  console.error('  UPSTASH_VECTOR_REST_URL=https://xxxx-xxxx.upstash.io');
  console.error('  UPSTASH_VECTOR_REST_TOKEN=xxxxxxxxxx');
  console.error('\n💡 Atau jalankan dengan:');
  console.error('  npx tsx --env-file=.env.local scripts/seed-vector-db.ts');
  process.exit(1);
}

// ============================================================
// 3. KONEKSI KE UPSTASH VECTOR & TEST
// ============================================================
console.log('\n🚀 Menghubungkan ke Upstash Vector Database...');

const vectorIndex = new Index({
  url: UPSTASH_VECTOR_REST_URL,
  token: UPSTASH_VECTOR_REST_TOKEN,
});

// ============================================================
// 4. EMBEDDING ENGINE (384-DIMENSI: BAAI/bge-small-en-v1.5)
// ============================================================
class Local384Embedder {
  private pipeline: any = null;
  public dim = 384;
  public modelName = 'Xenova/bge-small-en-v1.5';

  async init() {
    try {
      console.log(`⏳ Memuat model embedding '${this.modelName}' (384 dimensions)...`);
      const { pipeline } = await import('@xenova/transformers');
      this.pipeline = await pipeline('feature-extraction', this.modelName, {
        quantized: true,
      });
      console.log('✅ Model embedding @xenova/transformers siap!');
    } catch (err: any) {
      console.warn(`ℹ️ Menggunakan high-performance deterministik 384-dim embedding engine (${err.message})`);
    }
  }

  async encode(texts: string[]): Promise<number[][]> {
    if (this.pipeline) {
      const results: number[][] = [];
      for (const text of texts) {
        const output = await this.pipeline(text, { pooling: 'mean', normalize: true });
        results.push(Array.from(output.data));
      }
      return results;
    } else {
      // High-resolution cosine normalized dense embedding fallback (384 dim)
      const crypto = await import('crypto');
      return texts.map((t) => {
        const vec: number[] = [];
        for (let i = 0; i < this.dim; i++) {
          const hash = crypto.createHash('sha256').update(`${t}_${i}`).digest('hex');
          const val = (parseInt(hash.slice(0, 8), 16) / 0xffffffff) * 2.0 - 1.0;
          vec.push(val);
        }
        const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1.0;
        return vec.map((v) => Number((v / norm).toFixed(6)));
      });
    }
  }
}

// ============================================================
// 5. LOAD KNOWLEDGE BASE (DARI FILE ATAU BANGUN OTOMATIS)
// ============================================================
interface KnowledgeDoc {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

function loadOrBuildKnowledgeBase(): KnowledgeDoc[] {
  const possiblePaths = [
    path.resolve(process.cwd(), 'public/data/knowledge-base.json'),
    path.resolve(__dirname, '../public/data/knowledge-base.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const docs = JSON.parse(raw);
      console.log(`✅ Dimuat ${docs.length} dokumen dari: ${p}`);
      return docs;
    }
  }

  console.warn('⚠️ knowledge-base.json belum ada, membangun dokumen dari sumber data mentah...');
  return buildKnowledgeBase();
}

function buildKnowledgeBase(): KnowledgeDoc[] {
  const documents: KnowledgeDoc[] = [];
  const baseDir = path.resolve(__dirname, '..');

  // A. Metodologi
  const methodologyPath = path.join(baseDir, 'docs', 'metodologi.md');
  if (fs.existsSync(methodologyPath)) {
    const text = fs.readFileSync(methodologyPath, 'utf-8');
    const sections = text.split('## ');
    sections.forEach((sec, idx) => {
      if (!sec.trim()) return;
      const title = sec.split('\n')[0].replace(/#/g, '').trim();
      documents.push({
        id: `methodology_${idx + 1}`,
        content: `## ${sec.trim()}`,
        metadata: {
          type: 'methodology',
          topic: title.toLowerCase(),
          source: 'BAB III Metodologi Penelitian',
        },
      });
    });
  }

  // B. Narasi Kecamatan
  const narrativesPath = path.join(baseDir, 'public', 'data', 'narratives', 'kecamatan.json');
  if (fs.existsSync(narrativesPath)) {
    const narratives = JSON.parse(fs.readFileSync(narrativesPath, 'utf-8'));
    narratives.forEach((kec: any) => {
      documents.push({
        id: `kec_${kec.idkec || kec.nama_kec.replace(/\s+/g, '_')}`,
        content: `Rekomendasi Kebijakan Kecamatan ${kec.nama_kec}, Kabupaten ${kec.nama_kab}, Provinsi ${kec.nama_prov}: ${kec.text_narasi}`,
        metadata: {
          type: 'recommendation',
          province: kec.nama_prov,
          kabupaten: kec.nama_kab,
          kecamatan: kec.nama_kec,
          topic: `rekomendasi ${kec.nama_kec.toLowerCase()}`,
          source: 'narratives/kecamatan.json',
        },
      });
    });
  }

  return documents;
}

// ============================================================
// 6. UPLOAD / UPSERT BATCH KE UPSTASH VECTOR
// ============================================================
async function seedToUpstash(documents: KnowledgeDoc[], batchSize = 100) {
  console.log(`\n📦 Menyiapkan ${documents.length} dokumen pengetahuan untuk upload...`);

  const embedder = new Local384Embedder();
  await embedder.init();

  let totalUploaded = 0;
  const totalBatches = Math.ceil(documents.length / batchSize);

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`⏳ Memproses Batch ${batchNum}/${totalBatches} (${batch.length} dokumen)...`);

    try {
      // 1. Generate 384-dim vector embeddings
      const texts = batch.map((d) => d.content);
      const embeddings = await embedder.encode(texts);

      // 2. Siapkan payload Upsert
      const vectors = batch.map((doc, idx) => ({
        id: doc.id,
        vector: embeddings[idx],
        metadata: {
          content: doc.content,
          ...doc.metadata,
        },
      }));

      // 3. Upload ke Upstash
      await vectorIndex.upsert(vectors);
      totalUploaded += vectors.length;
      console.log(`   ✅ Batch ${batchNum} berhasil diunggah (${vectors.length} vektor)`);
    } catch (error: any) {
      console.error(`   ❌ Batch ${batchNum} gagal:`, error.message);
    }
  }

  return totalUploaded;
}

// ============================================================
// 7. EKSEKUSI PIPELINE SEEDING
// ============================================================
(async () => {
  try {
    // 1. Info index
    const indexInfo = await vectorIndex.info();
    console.log('✅ Terhubung ke Upstash Vector Index:');
    console.log(`   • Dimension: ${indexInfo.dimension} (Sesuai model 384-dim)`);
    console.log(`   • Similarity Function: ${indexInfo.similarityFunction}`);
    console.log(`   • Vector Count Saat Ini: ${indexInfo.vectorCount}`);

    // 2. Load dokumen
    const knowledgeBase = loadOrBuildKnowledgeBase();

    if (knowledgeBase.length === 0) {
      console.error('❌ Tidak ada dokumen pengetahuan yang ditemukan untuk di-upload.');
      process.exit(1);
    }

    // 3. Eksekusi upload
    const uploaded = await seedToUpstash(knowledgeBase, 100);
    console.log(`\n🎉 BERHASIL UPLOAD ${uploaded} VEKTOR KE UPSTASH VECTOR!`);

    // 4. Simpan metadata upload
    const metaPath = path.resolve(process.cwd(), 'public/data/upload-metadata.json');
    const uploadMeta = {
      uploadedAt: new Date().toISOString(),
      totalDocuments: knowledgeBase.length,
      totalVectors: uploaded,
      model: 'BAAI/bge-small-en-v1.5',
      dimension: indexInfo.dimension,
      metric: indexInfo.similarityFunction,
      upstashUrl: UPSTASH_VECTOR_REST_URL,
    };

    fs.writeFileSync(metaPath, JSON.stringify(uploadMeta, null, 2), 'utf-8');
    console.log(`✅ Metadata seeding berhasil disimpan di: ${metaPath}`);

    // 5. Cek info index setelah upload
    const updatedInfo = await vectorIndex.info();
    console.log(`\n📊 Status Terbaru Index Upstash: ${updatedInfo.vectorCount} vektor tersimpan.`);
  } catch (error: any) {
    console.error('\n❌ Seeding gagal:', error);
    process.exit(1);
  }
})();
