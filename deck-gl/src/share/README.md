# Share
git submodule として各プロジェクトで使う想定の共有ライブラリ集

## 共有ライブラリをプロジェクトリポジトリに追加する
プロジェクトリポジトリのルートで以下を実行する。

```
git submodule add git@gitlab.churadata.okinawa:kddi/webxr/share.git src/share
```

`src/share` をいうディレクトリが作成され、それ以下に submodule のファイルが含まれる。

詳しくは： [Git submodule の基礎 - Qiita](https://qiita.com/sotarok/items/0d525e568a6088f6f6bb)

## submodule のファイルを追従させる
プロジェクトリポジトリを `git clone` した直後や、プロジェクトリポジトリ内で checkout して submodule のリビジョンが変わった場合などは、submodule ディレクトリ内のファイルは自動で clone/checkout してくれないので、追従するためには以下コマンドを実行する。

```
git submodule update
```