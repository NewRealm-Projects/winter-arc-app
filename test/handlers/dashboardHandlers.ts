import { http, HttpResponse } from 'msw';

export const dashboardHandlers = [
  http.get('https://api.open-meteo.com/v1/forecast', () =>
    HttpResponse.json({
      current: {
        temperature_2m: 12,
        weather_code: 2,
      },
    })
  ),
];
