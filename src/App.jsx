import React, { useEffect, useState, useCallback } from "react";

const App = () => {
  // Состояния
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");
  const [accessToken, setAccessToken] = useState("");

  // Константы Google API
  const SPREADSHEET_ID = "1Q1nQdUuLWv-hrAF5iNcQfQ9AM8qyFhvuS3Qz5PbkICc";
  const RANGE = "Лист1!A1:K13";
  const API_KEY = "AIzaSyAQ0uwTA1-hMITm1Uf5pn4Si4YNAjojU2k";
  const CLIENT_ID = "777370749620-e10hr3r9q0uck0eierjm1csftvmvq3uf.apps.googleusercontent.com";
  const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

  // Константы TipTopPay
  const TIPTOPPAY_API_URL = "https://api.tiptoppay.kz/v2/";
  const TIPTOPPAY_EMAIL = "pk_a21a16690a667b858f400e15ba2fc";
  const TIPTOPPAY_PASSWORD = "ff595ad6386dd6d14d7d9207e88223a8";

  // Инициализация Google API
  useEffect(() => {
    const initializeGoogleAPI = async () => {
      try {
        if (!window.gapi) {
          await loadScript("https://apis.google.com/js/api.js");
        }
        if (!window.google) {
          await loadScript("https://accounts.google.com/gsi/client");
        }

        await new Promise((resolve, reject) => {
          window.gapi.load("client", { callback: resolve, onerror: reject });
        });

        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: () => {},
        });

        setMessage("Google API успешно инициализирован!");
        console.log("Google API успешно инициализирован.");
      } catch (error) {
        setMessage("Ошибка инициализации Google API: " + error.message);
        console.error("Ошибка инициализации Google API:", error);
      }
    };

    initializeGoogleAPI();
  }, []);

  // Вспомогательная функция для загрузки скриптов
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Получить платежи из TipTopPay
  const getTipTopPayPayments = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const createdDateGte = formatDateForTipTopPay(startDate);
      const createdDateLte = formatDateForTipTopPay(endDate);

      const requestBody = {
        CreatedDateGte: createdDateGte,
        CreatedDateLte: createdDateLte,
        PageNumber: 1,
        TimeZone: "UTC",
        Statuses: ["Completed"],
      };

      const authString = btoa(`${TIPTOPPAY_EMAIL}:${TIPTOPPAY_PASSWORD}`);
      const response = await fetch(`${TIPTOPPAY_API_URL}payments/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.Success) {
        return result.Model || [];
      } else {
        throw new Error(result.Message || "Неизвестная ошибка от TipTopPay");
      }
    } catch (error) {
      console.error("Ошибка при получении платежей:", error);
      throw error;
    }
  };

  // Формат даты под формат TipTopPay
  const formatDateForTipTopPay = (date) => {
    const isoStr = new Date(date).toISOString();
    return isoStr.slice(0, 19) + "Z"; // "2025-06-13T00:00:00Z"
  };

  // Обработчики авторизации
  const handleAuthSuccess = useCallback((response) => {
    console.log("Токен получен:", response);
    setAccessToken(response.access_token);
    setIsSignedIn(true);
    setMessage("Авторизация успешна!");
    window.gapi.client.setToken({ access_token: response.access_token });
  }, []);

  const handleAuthError = useCallback((error) => {
    console.error("Ошибка авторизации:", error);
    setMessage("Ошибка авторизации: " + error.message);
    setIsSignedIn(false);
    setAccessToken("");
  }, []);

  // Авторизация через Google
  const signIn = async () => {
    setIsLoading(true);
    setMessage("Запрос авторизации...");

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleAuthSuccess,
        error_callback: handleAuthError,
      });

      client.requestAccessToken();
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Выход
  const signOut = () => {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log("Токен отозван");
      });
    }

    setIsSignedIn(false);
    setAccessToken("");
    setData([]);
    setMessage("Выход выполнен успешно.");
    window.gapi.client.setToken(null);
  };

  // Чтение данных из Google Sheets
  const readGoogleSheet = async () => {
    if (!isSignedIn || !accessToken) {
      setMessage("Сначала авторизуйтесь!");
      return;
    }

    setIsLoading(true);
    setMessage("Читаем данные из таблицы...");

    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const rows = response.result.values;

      if (rows && rows.length > 0) {
        setData(rows);
        setMessage(`Данные успешно получены! Найдено ${rows.length} строк.`);
      } else {
        setMessage("Таблица пуста или данные не найдены.");
        setData([]);
      }
    } catch (error) {
      setMessage("Ошибка чтения таблицы: " + error.message);
      console.error("Ошибка чтения таблицы:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка и обновление статусов по платежам
  const checkAndUpdateStatusesWithTipTopPay = async () => {
    if (!isSignedIn || !accessToken) {
      setMessage("Сначала авторизуйтесь!");
      return;
    }

    setIsLoading(true);
    setMessage("Получаем данные из таблицы...");

    try {
      const sheetResponse = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const rows = sheetResponse.result.values;

      if (!rows || rows.length === 0) {
        setMessage("Данные не найдены в таблице.");
        return;
      }

      setMessage("Запрашиваем платежи из TipTopPay...");
      const payments = await getTipTopPayPayments();

      const paidEmails = new Set();
      payments.forEach((payment) => {
        if (payment.Email && payment.Status === "Completed") {
          paidEmails.add(payment.Email.toLowerCase().trim());
        }
      });

      let updatedCount = 0;
      const updatedRows = rows.map((row, index) => {
        if (index === 0) return row; // Пропуск заголовка

        const email = row[1] || "";
        const currentStatus = row[10] || "";

        if (
          email &&
          paidEmails.has(email.toLowerCase().trim()) &&
          currentStatus.trim() !== "Оплата ТИП ТОП ПЕЙ"
        ) {
          row[10] = "Оплата ТИП ТОП ПЕЙ";
          updatedCount++;
        }

        return row;
      });

      if (updatedCount > 0) {
        setMessage("Обновляем таблицу...");
        await updateGoogleSheet(updatedRows);
        setData(updatedRows);
        setMessage(`✅ Успешно обновлено ${updatedCount} статусов через TipTopPay!`);
      } else {
        setMessage("Не найдено новых оплаченных пользователей для обновления.");
      }
    } catch (error) {
      console.error("Ошибка при проверке статусов:", error);
      setMessage("Ошибка при проверке статусов: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление данных в Google Таблице
  const updateGoogleSheet = async (updatedData) => {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
        valueInputOption: "RAW",
        resource: { values: updatedData },
      });

      console.log("Таблица успешно обновлена:", response);
      return response;
    } catch (error) {
      console.error("Ошибка обновления таблицы:", error);
      throw error;
    }
  };

  // Тестовое подключение к TipTopPay
  const testTipTopPayConnection = async () => {
    setIsLoading(true);
    setMessage("Тестируем подключение к TipTopPay...");

    try {
      const payments = await getTipTopPayPayments();
      setMessage(
        `✅ Подключение к TipTopPay работает! Найдено ${payments.length} платежей за последние 30 дней.`
      );
    } catch (error) {
      setMessage("❌ Ошибка подключения к TipTopPay: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Google Sheets + TipTopPay</h1>

      {/* Статус авторизации */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50 border">
        <p className="text-sm text-gray-600">
          Статус авторизации:{" "}
          {isSignedIn ? (
            <span className="text-green-600 font-semibold">✓ Авторизован</span>
          ) : (
            <span className="text-red-600 font-semibold">✗ Не авторизован</span>
          )}
        </p>
        {accessToken && (
          <p className="text-xs text-gray-500 mt-1">Токен: {accessToken.substring(0, 20)}...</p>
        )}
      </div>

      {/* Кнопки управления */}
      <div className="flex flex-wrap gap-3 mb-6">
        {!isSignedIn ? (
          <button
            onClick={signIn}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {isLoading ? "Авторизация..." : "🔑 Войти через Google"}
          </button>
        ) : (
          <>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              🚪 Выйти
            </button>
            <button
              onClick={readGoogleSheet}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors duration-200"
            >
              {isLoading ? "Загрузка..." : "📊 Получить данные"}
            </button>
            <button
              onClick={testTipTopPayConnection}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors duration-200"
            >
              {isLoading ? "Тестирование..." : "🔗 Тест TipTopPay"}
            </button>
            <button
              onClick={checkAndUpdateStatusesWithTipTopPay}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 transition-colors duration-200"
            >
              {isLoading ? "Проверка TipTopPay..." : "💳 Обновить статусы"}
            </button>
          </>
        )}
      </div>

      {/* Сообщения */}
      {message && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-r-lg">
          <p className="font-medium">{message}</p>
        </div>
      )}

      {/* Отображение данных */}
      {data.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📋 Данные из таблицы ({data.length} строк):</h2>
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">#</th>
                  {data[0] &&
                    data[0].map((header, index) => (
                      <th key={index} className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">
                        {header || `Колонка ${index + 1}`}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 border-b text-sm text-gray-500 font-medium">{rowIndex + 2}</td>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`px-4 py-3 border-b text-sm ${
                          cellIndex === 10 && cell === "Оплата ТИП ТОП ПЕЙ"
                            ? "text-green-600 font-semibold bg-green-50"
                            : cellIndex === 10 && cell === "Неоплачен"
                            ? "text-red-600 font-semibold"
                            : cellIndex === 1
                            ? "text-blue-600 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {cell || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;