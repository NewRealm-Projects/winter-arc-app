import { http, HttpResponse } from 'msw';

export const notesHandlers = [
  http.post('https://generativelanguage.googleapis.com/*', async ({ request }: { request: Request }) => {
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'Mocked Gemini summary',
              },
            ],
          },
        },
      ],
      body,
    });
  }),
];
