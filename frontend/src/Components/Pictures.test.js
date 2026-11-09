import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PicturesPage from './Pictures';

function jsonResponse(data) {
  return {
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => data,
  };
}

test('opens the selected move when the page receives its query parameter', async () => {
  global.fetch = jest.fn((url) => {
    if (url.endsWith('/moves')) {
      return Promise.resolve(jsonResponse([
        { id: 3, name: 'Moving house', target_date: '2026-11-01' },
      ]));
    }
    if (url.endsWith('/trips')) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith('/picture-folders?move_id=3')) {
      return Promise.resolve(jsonResponse([]));
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  render(
    <MemoryRouter initialEntries={['/pictures?move=3']}>
      <PicturesPage />
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: 'Moving house' })).toBeInTheDocument();
  expect(
    await screen.findByText('No folders yet. Create one above to start adding pictures.')
  ).toBeInTheDocument();
});
