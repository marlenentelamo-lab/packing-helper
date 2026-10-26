import { fireEvent, render, screen } from '@testing-library/react';
import FolderList from './FolderList';

function jsonResponse(data) {
  return {
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => data,
  };
}

test('creates a folder for the selected move and displays it', async () => {
  const folder = {
    id: 12,
    folder_name: 'Kitchen',
    move_id: '3',
    trip_id: null,
    picture_count: 0,
  };
  const fetchMock = jest.fn((url, options) => {
    if (url === '/api/picture-folders?move_id=3' && options.method === 'GET') {
      return Promise.resolve(jsonResponse([]));
    }
    if (url === '/api/picture-folders' && options.method === 'POST') {
      return Promise.resolve(jsonResponse(folder));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = fetchMock;

  render(<FolderList selected={{ type: 'move', id: '3' }} onOpen={jest.fn()} />);

  fireEvent.change(await screen.findByLabelText('New folder'), {
    target: { value: '  Kitchen  ' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create folder' }));

  expect(await screen.findByText('Kitchen')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith('/api/picture-folders', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder_name: 'Kitchen', move_id: '3' }),
  });
  expect(screen.getByText('0 pictures')).toBeInTheDocument();
  expect(screen.getByLabelText('New folder')).toHaveValue('');
});
