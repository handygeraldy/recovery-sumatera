import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { Index } from '@upstash/vector';
import fs from 'fs';
import path from 'path';

interface KnowledgeDoc {
  id: string;
  content: string;
  metadata: {
    type: string;
    province?: string;
    kabupaten?: string;
    kecamatan?: string;
    topic: string;
    source: string;
  };
}

// Model Groq yang aktif dan valid
const MODEL = 'openai/gpt-oss-120b';

const UPSTASH_VECTOR_REST_URL = process.env.UPSTASH_VECTOR_REST_URL;
const UPSTASH_VECTOR_REST_TOKEN = process.env.UPSTASH_VECTOR_REST_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Cache dokumen knowledge base lokal untuk fallback cepat
let localKbCache: KnowledgeDoc[] | null = null;

function getLocalKnowledgeBase(): KnowledgeDoc[] {
  if (localKbCache) return localKbCache;
  try {
    const kbPath = path.join(process.cwd(), 'public', 'data', 'knowledge-base.json');
    if (fs.existsSync(kbPath)) {
      localKbCache = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));
      return localKbCache || [];
    }
  } catch (err) {
    console.error('Error reading local knowledge base:', err);
  }
  return [];
}

/**
 * Retrieval dokumen relevan menggunakan Upstash Vector dengan fallback in-memory search
 */
async function getRelevantDocuments(query: string, limit: number = 5): Promise<KnowledgeDoc[]> {
  const cleanQuery = query.toLowerCase().trim();

  // 1. Coba Retrieval via Upstash Vector (jika kredensial tersedia)
  if (UPSTASH_VECTOR_REST_URL && UPSTASH_VECTOR_REST_TOKEN) {
    try {
      const vectorIndex = new Index({
        url: UPSTASH_VECTOR_REST_URL,
        token: UPSTASH_VECTOR_REST_TOKEN,
      });

      const results = await vectorIndex.query({
        data: query,
        topK: limit,
        includeMetadata: true,
      });

      if (results && results.length > 0) {
        return results.map((r: any) => ({
          id: String(r.id),
          content: r.metadata?.content || String(r.id),
          metadata: r.metadata || { type: 'vector', topic: 'general', source: 'upstash' },
        }));
      }
    } catch (err: any) {
      // Fallback diam-diam ke pencarian lokal berakurasi tinggi
    }
  }

  // 2. Fallback: Pencarian Relevansi Kontekstual Lokal (Keyword & Topic Scoring)
  const localDocs = getLocalKnowledgeBase();
  if (localDocs.length === 0) return [];

  const queryTerms = cleanQuery
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scoredDocs = localDocs.map((doc) => {
    let score = 0;
    const contentLower = doc.content.toLowerCase();
    const topicLower = doc.metadata.topic?.toLowerCase() || '';
    const kecLower = doc.metadata.kecamatan?.toLowerCase() || '';
    const kabLower = doc.metadata.kabupaten?.toLowerCase() || '';
    const provLower = doc.metadata.province?.toLowerCase() || '';

    // Exact name match bonus
    if (kecLower && cleanQuery.includes(kecLower)) score += 20;
    if (kabLower && cleanQuery.includes(kabLower)) score += 10;
    if (provLower && cleanQuery.includes(provLower)) score += 5;
    if (topicLower && cleanQuery.includes(topicLower)) score += 15;

    // Term frequency scoring
    for (const term of queryTerms) {
      if (topicLower.includes(term)) score += 5;
      if (contentLower.includes(term)) score += 2;
    }

    return { doc, score };
  });

  scoredDocs.sort((a, b) => b.score - a.score);
  return scoredDocs.slice(0, limit).map((s) => s.doc);
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const latestMessage = messages[messages.length - 1];
    const userQuery = latestMessage.content || '';

    console.log(`📩 Received query: "${userQuery}"`);

    // 1. Ambil dokumen relevan dari Knowledge Base
    const relevantDocs = await getRelevantDocuments(userQuery, 5);
    console.log(`📚 Found ${relevantDocs.length} relevant documents`);

    const contextText =
      relevantDocs.length > 0
        ? relevantDocs
            .map((doc, i) => `--- DOKUMEN RELEVAN ${i + 1} (${doc.metadata.source || 'Knowledge Base'}) ---\n${doc.content}`)
            .join('\n\n')
        : 'Data spesifik tidak ditemukan di database.';

    // 2. Susun System Prompt ter-grounding data dengan instruksi KaTeX yang jelas
    const systemPrompt = `
Anda adalah **Asisten AI Recovery Sumatera**, sebuah sistem pakar interaktif yang membantu pengambil kebijakan, peneliti, dan masyarakat umum memahami data ketahanan pangan dan pemulihan pasca-bencana di pulau Sumatera (Aceh, Sumatera Utara, dan Sumatera Barat).

### INFORMASI & KONTEKS RISET:
${contextText}

### PEDOMAN FORMAT & FORMULA MATEMATIKA:
1. **Bahasa:** Gunakan Bahasa Indonesia yang ramah, profesional, dan berbasis data ilmiah.
2. **Formula Matematika (KaTeX / LaTeX):**
   - Gunakan format LaTeX yang valid untuk persamaan matematika:
     * Formula Block:
       \\[ \\text{Neraca Pangan (Mcal)} = \\text{Ketersediaan Energi} - \\text{Kebutuhan Energi} \\]
     * Formula Kebutuhan:
       \\[ \\text{Kebutuhan Energi} = \\text{Populasi} \\times 2.100\\text{ kcal/kapita/hari} \\times \\text{Hari} \\]
     * Formula Ketersediaan:
       \\[ \\text{Ketersediaan Energi} = \\text{Produksi Padi (Ton)} \\times 0.64 \\times 3.630\\text{ kcal/kg} \\]
     * Formula Inline: \\( E_{\\text{balance}} > 0 \\) (surplus) atau \\( E_{\\text{balance}} < 0 \\) (defisit).
   - Jangan menulis teks LaTeX mentah yang rusak seperti "\\text{textbf{...}}".
3. **Kesesuaian Data:**
   - **Produktivitas Padi:** Satuan **Ton/km²** (bukan Ton/Ha), dimodelkan dengan CatBoost & Remote Sensing (Sentinel-2 NDVI/NDDI, CHIRPS, SMAP, NASADEM, Dynamic World).
   - **Periode Waktu:** Tiga periode (Okt 2025: Pra-Bencana, Des 2025: Saat Bencana, Mar 2026: Pasca-Bencana).
   - **5 Kelas Ketahanan (Resilience):** \`resilient_pulih_penuh\`, \`tidak_terdampak\`, \`pulih_sebagian\`, \`pulih_lambat\`, \`memburuk_tidak_pulih\`.
   - **Skor Recovery:** Indeks kontinu 0.0 - 1.0.
4. **Struktur:** Gunakan bullet points yang rapi dan tabel markdown untuk membandingkan kategori jika relevan.
`.trim();

    // 3. Inisialisasi Provider Groq
    if (!GROQ_API_KEY || GROQ_API_KEY.includes('your_groq_api_key')) {
      return new Response(
        `Halo! Koneksi AI asisten aktif dengan data lokal. Untuk menghubungkan live LLM Groq streaming, silakan set \`GROQ_API_KEY\` pada \`.env.local\` atau Vercel Environment Variables.\n\n**Data Terkait Pertanyaan Anda:**\n${
          relevantDocs[0]?.content || 'Dashboard memantau 13.900 desa di Aceh, Sumut, dan Sumbar.'
        }`,
        {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      );
    }

    console.log(`🤖 Generating response with Groq (model: ${MODEL})...`);

    const groq = createGroq({
      apiKey: GROQ_API_KEY,
    });

    // 4. Stream response menggunakan model yang aktif dan valid
    const result = streamText({
      model: groq(MODEL),
      system: systemPrompt,
      messages,
      temperature: 0.3,
    });

    console.log('✅ Response stream initialized successfully');
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('❌ Chat API Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Terjadi kesalahan saat memproses permintaan chat.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
