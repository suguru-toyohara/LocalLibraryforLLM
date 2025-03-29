import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// 環境変数の型定義
interface Env {
  // 必要に応じてKVやD1などのBindingsを追加
}

// アプリケーションのメインインスタンス
const app = new Hono<{ Bindings: Env }>();

// ミドルウェアの設定
app.use('*', logger());
app.use('*', cors()); //FIXME: 本当に大丈夫？

// ルートエンドポイント
app.get('/', (c) => {
  return c.json({
    message: 'LLLLM Backend API',
    version: '0.1.0',
    status: 'running'
  });
});

/**
 * データモデルとサービス設計メモ
 * 
 * 1. リソース管理
 *  - ドキュメント、コード例、API仕様などの保存と取得
 *  - タグ付け、カテゴリ分け機能
 * 
 * 2. LLM Prompt Logging
 *  - ユーザー・LLM間の対話履歴記録
 *  - プロンプトパターン分析
 * 
 * 3. RAG (Retrieval Augmented Generation)
 *  - ベクトル検索による関連情報抽出
 *  - LLMへのコンテキスト提供
 * 
 * 4. mastraとの統合
 *  - 連携APIの設計
 */

// APIルーターの設定
const api = new Hono();

// リソース管理API
const resources = new Hono();
resources.get('/', (c) => c.json({ message: 'Resources API' }));
resources.post('/', (c) => c.json({ message: 'Resource created' }, 201));
resources.get('/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ id, message: `Resource ${id}` });
});

// Promptログ管理API
const prompts = new Hono();
prompts.get('/', (c) => c.json({ message: 'Prompts API' }));
prompts.post('/', (c) => c.json({ message: 'Prompt logged' }, 201));

// RAG API
const rag = new Hono();
rag.post('/query', (c) => c.json({ message: 'RAG query processed' }));

// マウント
api.route('/resources', resources);
api.route('/prompts', prompts);
api.route('/rag', rag);

// APIをメインアプリにマウント
app.route('/api', api);

// Workers向けのエクスポート
export default app;
