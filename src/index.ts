#!/usr/bin/env node

/**
 * TODOのMCPサーバー
 * 提供する機能：
 * - TODOの追加
 * - TODOの完了
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";

/**
 * TODOアイテムの型定義
 */
type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
};

/**
 * インメモリでTODOアイテムを保持する
 * 実際のアプリケーションではデータベースなどを使用するべき
 */
const todos: { [id: string]: TodoItem } = {
  "1": { id: "1", title: "MCPの基礎を作成する", completed: true },
  "2": { id: "2", title: "TODOMCPを作成する", completed: true },
  "3": { id: "3", title: "TODOのmcpをテストする", completed: false }
};

/**
 * MCP サーバーの作成
 * リソースとツールの機能を有効化
 */
const server = new Server(
  {
    name: "todo",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * 利用可能なTODOリソースをリストアップするハンドラー
 * 各TODOは以下の情報を持つリソースとして公開:
 * - todo:// URIスキーム
 * - プレーンテキストMIMEタイプ
 * - 人間が読める名前と説明（TODOの状態を含む）
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.values(todos).map((todo) => ({
      uri: `todo:///${todo.id}`,
      mimeType: "text/plain",
      name: `${todo.completed ? "✓" : "□"} ${todo.title}`,
      description: `状態: ${todo.completed ? "完了" : "未完了"}`
    }))
  };
});

/**
 * 特定のTODOの内容を読み取るハンドラー
 * todo:// URIを受け取り、TODOの情報をプレーンテキストとして返す
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const id = url.pathname.replace(/^\//, '');
  const todo = todos[id];

  if (!todo) {
    throw new McpError(ErrorCode.InvalidRequest, `Todo ${id} not found`);
  }

  return {
    contents: [{
      uri: request.params.uri,
      mimeType: "text/plain",
      text: `ID: ${todo.id}\nタイトル: ${todo.title}\n状態: ${todo.completed ? "完了" : "未完了"}`
    }]
  };
});

/**
 * 利用可能なツールをリストアップするハンドラー
 * - add_todo: 新しいTODOを追加するツール
 * - complete_todo: TODOを完了状態に変更するツール
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_todo",
        description: "新しいTODOを追加する",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "TODOのタイトル"
            }
          },
          required: ["title"]
        }
      },
      {
        name: "complete_todo",
        description: "TODOを完了状態に変更する",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "完了するTODOのID"
            }
          },
          required: ["id"]
        }
      }
    ]
  };
});

/**
 * ツール実行のハンドラー
 * - add_todo: 指定されたタイトルで新しいTODOを作成
 * - complete_todo: 指定されたIDのTODOを完了状態に変更
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "add_todo": {
      const title = String(request.params.arguments?.title);
      if (!title) {
        throw new McpError(ErrorCode.InvalidParams, "タイトルは必須です");
      }

      // 新しいIDを生成（実際のアプリケーションではもっと堅牢な方法を使用するべき）
      const id = String(Object.keys(todos).length + 1);
      todos[id] = { id, title, completed: false };

      return {
        content: [{
          type: "text",
          text: `TODOを追加しました - ID: ${id}, タイトル: ${title}`
        }]
      };
    }

    case "complete_todo": {
      const id = String(request.params.arguments?.id);
      if (!id) {
        throw new McpError(ErrorCode.InvalidParams, "IDは必須です");
      }

      const todo = todos[id];
      if (!todo) {
        throw new McpError(ErrorCode.InvalidRequest, `ID ${id} のTODOは見つかりません`);
      }

      // すでに完了している場合は通知のみ
      if (todo.completed) {
        return {
          content: [{
            type: "text",
            text: `ID ${id} のTODOはすでに完了しています`
          }]
        };
      }

      // TODOを完了状態に更新
      todos[id] = { ...todo, completed: true };

      return {
        content: [{
          type: "text",
          text: `ID ${id} のTODO「${todo.title}」を完了しました`
        }]
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, "不明なツールです");
  }
});

/**
 * stdioトランスポートを使用してサーバーを起動
 * 標準入出力ストリームを介してサーバーが通信できるようにする
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TODO MCPサーバーが起動しました");
}

main().catch((error) => {
  console.error("サーバーエラー:", error);
  process.exit(1);
});
