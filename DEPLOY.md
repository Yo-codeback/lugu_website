# GitHub Pages 部署指南

## 快速開始

### 步驟 1：準備倉庫

1. 在 GitHub 建立新倉庫
2. 將所有檔案推送到倉庫

### 步驟 2：設定 API 密鑰（使用 GitHub Secrets）

1. 前往您的 GitHub 倉庫
2. 點擊 `Settings`（設定）
3. 在左側選單找到 `Secrets and variables` > `Actions`
4. 點擊 `New repository secret`（新增倉庫密鑰）
5. 填寫：
   - **Name（名稱）**: `WEATHER_API_KEY`
   - **Secret（密鑰）**: 貼上您的中央氣象署 API 授權碼
6. 點擊 `Add secret`（新增密鑰）

### 步驟 3：啟用 GitHub Pages

1. 在倉庫中，點擊 `Settings`（設定）
2. 在左側選單找到 `Pages`（頁面）
3. 在 `Source`（來源）中選擇 `GitHub Actions`
4. 儲存設定

### 步驟 4：推送程式碼

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 步驟 5：等待部署

1. 前往 `Actions`（操作）分頁
2. 查看部署進度
3. 部署完成後，前往 `Settings` > `Pages` 查看網站網址

## 重要提醒

⚠️ **請勿將包含實際 API 密鑰的 `config.js` 提交到 GitHub！**

- 使用 GitHub Secrets 來安全地存儲 API 密鑰
- GitHub Actions 會在部署時自動建立 `config.js`
- 您的 API 密鑰不會出現在公開的程式碼中

## 故障排除

### 問題：網站顯示 API 錯誤

**解決方案：**
1. 確認 GitHub Secrets 中的 `WEATHER_API_KEY` 已正確設定
2. 確認 API 密鑰格式正確（不包含多餘的空格或引號）
3. 檢查 GitHub Actions 的部署日誌

### 問題：GitHub Pages 無法載入

**解決方案：**
1. 確認已啟用 GitHub Pages（Settings > Pages）
2. 確認選擇了正確的分支
3. 等待幾分鐘讓 GitHub 完成部署
4. 清除瀏覽器快取後重新載入

### 問題：config.js 未建立

**解決方案：**
1. 確認 GitHub Actions 工作流程已執行
2. 檢查 `.github/workflows/deploy-simple.yml` 是否存在
3. 查看 Actions 分頁中的錯誤訊息

## 更新網站

每次您推送新的程式碼到 `main` 或 `master` 分支時，GitHub Actions 會自動重新部署網站。

## 聯絡方式

如有問題，請聯絡：makerbackup0821@gmail.com

