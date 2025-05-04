function doGet(e) {
  const page = e.parameter.page || "check";
  if (page === "cart") {
    return HtmlService.createHtmlOutputFromFile("cart_page")
      .setTitle("購物車")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if(page === "view"){
    return HtmlService.createHtmlOutputFromFile("orderview")
      .setTitle("訂單查詢")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }else{
      return HtmlService.createHtmlOutputFromFile("checkout")
      .setTitle("結帳頁面")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// 📦 給購物車使用
function getProducts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("商品清單");
  const c_data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  return c_data.map(([name, price]) => ({ name, price, quantity: 0 }));
}

function submitOrder(products) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("訂單記錄");
  const timestamp = new Date();
  const orderId = Utilities.formatDate(timestamp, "Asia/Taipei", "yyyyMMdd-HHmmss");

  let total = 0;

  products.forEach(p => {
    if (p.quantity > 0) {
      const subtotal = p.price * p.quantity;
      total += subtotal;

      sheet.appendRow([
        timestamp,
        orderId,
        p.name,
        p.quantity,
        p.price,
        subtotal,
        
      ]);
    }
  });
 
  return total;
}

// 🔍 給查詢訂單頁使用
function getOrders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("訂單記錄");
  if (sheet.getLastRow() < 2) return JSON.stringify([]); // 沒有資料，直接回傳空陣列字串

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();

  const orders = {};

  for (let i = 0; i < data.length; i++) { // 跳過標題列
    const [timestamp, orderId, product, quantity, price, subtotal] = data[i];
 
    if (orders[orderId]==null) {
      orders[orderId] = {
        time: timestamp,
        items: [],
        total: 0
      };
    }

    orders[orderId].items.push({product, quantity, price, subtotal }); 
    orders[orderId].total += subtotal;

    //Logger.log(orders[orderId]); // 🔍 確認有沒有抓到資料
  }
  Logger.log(data); // 🔍 確認有沒有抓到資料
  /*Logger.log(JSON.stringify(data))*/
 
  const result = Object.entries(orders).map(([orderId, order]) => ({
  orderId,
  time: order.time,
  items: order.items,
  total: order.total
}));

Logger.log(JSON.stringify(result, null, 2));  // 📦 確認回傳資料
return JSON.stringify(result, null, 2);

}

function getBarcodeBase64(orderId) {
  const url = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(orderId)}&scale=3&includetext`;
  const response = UrlFetchApp.fetch(url);
  const blob = response.getBlob();
  const base64 = Utilities.base64Encode(blob.getBytes());
  return `data:image/png;base64,${base64}`;
}


