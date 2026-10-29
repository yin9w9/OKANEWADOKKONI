# お金はどこに 

日系莫蘭迪色個人記帳網頁，繁體中文、TWD、響應式設計。純 HTML/CSS/JavaScript，無須編譯。

## 第一版功能

- 收入、支出、帳戶轉帳；新增、編輯、刪除。
- 自訂分類名稱、圖示、色彩；帳戶名稱、期初餘額；使用中的項目禁止刪除。
- 每月收支總覽、分類圓環圖、最近紀錄。
- 依月份、類型、分類、帳戶及備註搜尋。
- 每月及分類預算、已用及剩餘額度。
- 當月全部紀錄 CSV 匯出（不套用搜尋篩選）、完整 JSON 備份下載。
- 本機儲存；設定 Firebase 後使用 Google 登入並透過 Firestore 即時同步。
- 本機資料不會自動上傳。登入後可明確選擇合併匯入；相同 ID 保留雲端內容。

## 本機預覽

在此資料夾使用 `node server.cjs`，開啟 http://localhost:4173 。不要直接以 file:// 開啟。字體與雲端 SDK 需要網路，本機資料在瀏覽器內保存，清除瀏覽器資料會刪除本機帳本，請定期備份。

## GitHub Pages 部署

1. 建立 GitHub repository，將本資料夾「內的檔案」上傳到儲存庫根目錄（index.html 應在根目錄）。不要上傳個人資料備份。
2. Settings → Pages → Deploy from a branch → main / (root) → Save。
3. 完成後開啟 `https://你的帳號.github.io/儲存庫名稱/`。所有資源使用相對路徑，支援專案子路徑。

## Firebase 設定（必須完成才可跨裝置同步）

1. 在 Firebase Console 建立專案並新增 Web app，複製 firebaseConfig。
2. Authentication → Sign-in method，啟用 Google，設定支援電子郵件。
3. Authentication → Settings → Authorized domains，加上 `你的帳號.github.io`；本機測試加上 `localhost`。
4. 建立 Cloud Firestore，將此資料夾 `firestore.rules` 全文貼至 Rules 並發布。不要開放所有人讀寫。
5. 建議將 Firebase Web 設定填入 `firebase-config.js`，取代 `null`，再隨網站一起部署。也可在網站「同步與設定」輸入合法 JSON，作為目前瀏覽器的專案設定覆寫。
6. 使用 Google 登入；若已部署 `firebase-config.js`，另一部裝置只需開啟網站並使用相同 Google 帳號登入。允許登入彈出視窗；手機建議使用 Safari 或 Chrome，而非通訊軟體內嵌瀏覽器。
7. Web config 是公開識別設定，資料保護依靠 Authentication 與 Firestore Rules。絕不可加入服務帳號金鑰。詳細建立步驟請閱讀 [SETUP.md](SETUP.md)。

官方參考：[Firebase Google 登入](https://firebase.google.com/docs/auth/web/google-signin)、[Firestore 安全規則](https://firebase.google.com/docs/firestore/security/get-started)。

雲端資料儲存在 users/{uid}/{entries,accounts,categories,budgets}/{id}。不同紀錄獨立寫入，同一紀錄多裝置同時編輯採最後寫入結果。第一版雲端儲存需連線，失敗時顯示錯誤，不宣稱已同步；尚未提供離線雲端佇列、背景排程及備份還原。

## 驗證限制

未提供真實 Firebase 專案及 GitHub 儲存庫，交付時不會自動發布或宣稱雲端登入測試成功。請設定後，以兩部裝置測試登入、新增、修改及刪除；確認另一端更新及登出後資料隔離。

## 介面更新

配色改為木質棕、霧藍與米白，移除抒情標語。五頁採用獨立資訊層級：總覽指標與支出分布、明細篩選統計、預算設定與分類進度、帳戶淨額及分類管理、登入備份與專案設定。保留原本的本機資料儲存識別碼，更新介面不會重設帳本。

分類圖使用新帳本預設配色；既有帳本保留自訂分類色。平均每日支出為當月支出除以當月日數。帳戶淨額涵蓋所有月份，與選取月份的收支結餘不同。

## 本機驗收紀錄

已以瀏覽器實測新增支出與收入、轉帳、交易修改、搜尋及重設篩選、預算儲存與超支提示、重新整理保留資料，以及 CSV / JSON 實際下載。測試資料使用獨立來源，沒有加入 localhost 正式預覽帳本。已檢查 390px 手機寬度並調整底部導覽及圖表排版。Firebase 設定與 GitHub 儲存庫仍待建立，雲端同步及公開部署尚未實測。
