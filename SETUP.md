# 建立 Firebase 與 GitHub Pages

目前網站可以在本機使用。要讓手機與電腦同步，請依下列步驟建立服務。

## 1. 建立 Firebase 專案

1. 開啟 [Firebase Console](https://console.firebase.google.com/)，登入你的 Google 帳號，選擇建立專案。
2. 專案名稱可填 `OKANEWADOKKONI`。專案 ID 由 Firebase 確認可用性；不必與網站名稱相同。此版不需要 Google Analytics。
3. 進入專案總覽，新增應用程式，選擇 Web（`</>`），名稱填 `OKANEWADOKKONI`。網站將使用 GitHub Pages，不必啟用 Firebase Hosting。
4. 在「專案設定 → 一般 → 你的應用程式 → SDK 設定」找到 `firebaseConfig` 物件。
5. 將物件貼給這個聊天，或填入專案內 `firebase-config.js`，取代 `null`。格式如下：

```js
export const firebaseConfig = {
  apiKey: "你的 Web API key",
  authDomain: "你的專案.firebaseapp.com",
  projectId: "你的專案 ID",
  storageBucket: "Firebase 提供的值",
  messagingSenderId: "Firebase 提供的值",
  appId: "Firebase 提供的值"
};
```

請以 Firebase 顯示的原始值為準。這是公開的 Web 設定，不能放服務帳號私鑰或帳號密碼。網站的資料權限由登入與 Firestore 規則控制。

## 2. 啟用 Google 登入

1. 專案左側 Build → Authentication → 開始使用。
2. Sign-in method → Google → 啟用，選擇專案支援電子郵件，儲存。
3. Settings → Authorized domains → 加入 `localhost`，供本機測試使用。
4. 稍後確認 GitHub 帳號後，再加入 `你的帳號.github.io`，不要加 `https://` 或儲存庫路徑。

2025-04-28 後建立的 Firebase 專案不會預設授權 localhost，需要自行加入。[官方說明](https://firebase.google.com/docs/auth/faq-and-troubleshooting)

## 3. 建立 Firestore 資料庫

1. Build → Firestore Database → Create database。
2. 使用預設資料庫 `(default)`，選擇合適區域並採用 Production mode；此版使用一般 Firestore 文件功能。
3. 資料庫建立後，開啟 Rules。
4. 將本資料夾 `firestore.rules` 全文貼上，按 Publish。規則限定登入者只能存取自己 UID 下的帳本。
5. 不需要手動新增 collections，首次登入時網站會建立預設分類與帳戶。

## 4. 建立 GitHub 儲存庫

1. 開啟 [新增 GitHub 儲存庫](https://github.com/new)。
2. Repository name 填 `OKANEWADOKKONI`。個人免費方案通常使用 Public repository 發布 Pages；若選 Private，請先確認帳號方案支援。
3. 加入 README，完成建立後，將儲存庫網址貼給這個聊天。
4. 將網站檔案放在儲存庫根目錄：`index.html`、`style.css`、`app.js`、`firebase-config.js`、`.nojekyll`。可一併放入 README、SETUP、firestore.rules；`server.cjs` 僅供本機預覽。
5. **上傳資料夾內的檔案，不要將整個資料夾再包一層。** `index.html` 應直接出現在儲存庫根目錄。不要上傳個人 CSV 或 JSON 備份。

## 5. 開啟 GitHub Pages

1. 儲存庫 Settings → Pages。
2. Source 選 Deploy from a branch。
3. Branch 選 `main`，資料夾選 `/ (root)`，按 Save。
4. 等待部署完成，開啟 `https://你的帳號.github.io/OKANEWADOKKONI/`。網址以 Pages 頁面顯示的值為準。
5. 回 Firebase Authentication 的 Authorized domains，確認已加入 `你的帳號.github.io`。

[GitHub Pages 官方部署說明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 6. 手機與電腦驗收

1. 兩部裝置都開啟上面的 Pages 網址，使用同一個 Google 帳號登入。
2. 在電腦新增一筆測試支出，確認手機出現；在手機修改金額，確認電腦更新。
3. 檢查帳戶轉帳不會增加收入或支出總計。
4. 確認右上角顯示「雲端已同步」，並測試資料備份下載。
5. 原有本機資料不會自動上傳；需要時，在設定頁選擇「合併匯入」。本機資料綁定網址與瀏覽器，本機 localhost 帳本與 Pages 網址的本機帳本不同。

## 可直接回覆給我的資料

```text
GitHub 儲存庫網址：https://github.com/你的帳號/OKANEWADOKKONI
firebaseConfig：貼上 Firebase 提供的 Web 設定物件
Google 登入：已啟用 / 尚未啟用
Firestore 與規則：已完成 / 尚未完成
```
