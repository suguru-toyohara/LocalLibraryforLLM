# LocalLibraryforLLM

通称：LLLLM
開発に必要な資料などをMCPサーバに移譲することで開発をスムーズに進める目的で作成。

CLINE 3.7.0で動作確認済。

# How to use

## 1.cloneする

まずはgitcloneを行いましょう。

```sh
cd path/to/gitclone/
git clone https://github.com/suguru-toyohara/LocalLibraryforLLM.git
```

## 2.MCPサーバをビルドする

次にBuildを行いましょう。

```sh
npm run build
```

## 3.CLINEにMCPサーバを繋げましょう。

cline_mcp_settings.jsonを下記のように変更
( 在処は探してください。 macだとLibrary/Application Support/Code/User/globalStorage/ 配下にフォルダがあります。 )

```json
{
  "mcpServers": {
    "todo": {
      "command": "zsh",
      "args": [
        "/Users/<username>/.asdf/shims/npx",
        "-yp",
        "node@20.17.0",
        "/Users/path/to/gitclone/LocalLibraryforLLM/build/index.js"
      ],
      "autoApprove": [
        "add_todo",
        "complete_todo"
      ],
      "disabled": false
    }
  }
}
```

