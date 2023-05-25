# 概要

KDDI WEBXR 案件の Three.js × React × TypeScript で 3DoF の WebAR プロジェクトの最小構成のプロジェクトです。

## Clone

```console
git clone --recursive git@gitlab.churadata.okinawa:kddi/webxr/three-dof-base-webar.git
```

## Setup

以下を参考に `docker-compose.env.yml` ファイルを作成する

```yaml:docker-compose.env.yml
services:
  dev-server:
    environment:
      # インターネットからアクセスする際のパス (メンバー毎に異なる)
      VITE_BASE_URL: /dev-sugimoto/
      # CMS 関連
      VITE_CMS_API_ENDPOINT: https://gw.fs.xreality.au.com
      VITE_CMS_API_KEY: ...
      VITE_CMS_APP_ID: ...
      VITE_CMS_EVENT_ID: ...
      VITE_CMS_PROMOTION_ID: ...

  ssh-client:
    environment:
      # リモートサーバ内にフォワードするポート番号 (メンバー毎に異なる)
      FORWARD_PORT: 3300

secrets:
  # EC2 インスタンスに SSH するための秘密鍵ファイル
  ssh_identity_file:
    file: ~/.ssh/id_rsa
```

## Start Development

```console
docker compose up
```

## Add Package

```console
docker compose run dev-server npm install <package>
```

## Deploy

ビルドしてサーバにデプロイするには [deploy.sh](deploy.sh) を使用する

```console
./deploy.sh {TARGET}
```
