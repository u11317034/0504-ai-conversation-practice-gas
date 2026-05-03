/**
 * 情境對話模擬器 - 後端邏輯 (高相容穩定版)
 */

// 安全讀取 API Key
function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

// 建立網頁入口
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('AI 情境對話模擬器')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 處理與 Gemini API 的對話
function sendChatMessage(scenario, userMessage, history) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("系統錯誤：未設定 API Key");

  // 使用最標準的 v1 路徑
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // 轉換歷史紀錄格式
  let contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
  
  // 💯 終極解法：如果是第一回合對話，將情境指令隱藏在用戶訊息的最前面
  let finalMessage = userMessage;
  if (contents.length === 0) {
    finalMessage = `【系統指令：你現在正在進行情境模擬扮演。情境是：「${scenario}」。請完全投入角色，使用自然、簡潔的繁體中文對話。不要破壞角色設定，不要給予解釋。如果用戶完成任務，請禮貌地結束對話。】\n\n這是我對你說的話：${userMessage}`;
  }

  // 加入本次輸入
  contents.push({ role: "user", parts: [{ text: finalMessage }] });

  // 移除容易引發版本衝突的 systemInstruction 欄位，只使用最核心的 contents
  const payload = {
    contents: contents
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const resJson = JSON.parse(response.getContentText());
    if (resJson.error) throw new Error(resJson.error.message);

    return resJson.candidates[0].content.parts[0].text;
  } catch (e) {
    throw new Error("API 連線失敗：" + e.toString());
  }
}
