const LOG_API = "http://4.224.186.213/evaluation-service/logs";

export async function Log(stack, level, packageName, message) {
  try {
    const response = await fetch(LOG_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ5ZXJyYW1pbGxpdmFpc2huYXZpLjIzLmNzbUBhbml0cy5lZHUuaW4iLCJleHAiOjE3ODIxOTM1OTQsImlhdCI6MTc4MjE5MjY5NCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjVjNDRkMDJjLTBjNTItNDk3Zi1iYjM1LWUyMjVkNGRmODdiNiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InZhaXNobmF2aSB5ZXJyYW1pbGxpIiwic3ViIjoiY2YzMjllYWEtOThhOC00NGE1LTg5OWItMTdiYmY2YjhjNTE4In0sImVtYWlsIjoieWVycmFtaWxsaXZhaXNobmF2aS4yMy5jc21AYW5pdHMuZWR1LmluIiwibmFtZSI6InZhaXNobmF2aSB5ZXJyYW1pbGxpIiwicm9sbE5vIjoiYTIzMTI2NTUyMDY1IiwiYWNjZXNzQ29kZSI6Ik1UcXhhciIsImNsaWVudElEIjoiY2YzMjllYWEtOThhOC00NGE1LTg5OWItMTdiYmY2YjhjNTE4IiwiY2xpZW50U2VjcmV0IjoiRmJDYnNnd0N5c0RIa0tTYyJ9.dSB3Jnk-rU5nnhxzDweO_qTIzmwQJ4tjga9KlJuYfBc",
      },
      body: JSON.stringify({
        stack,
        level,
        package: packageName,
        message,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      error: error.message,
    };
  }
}
