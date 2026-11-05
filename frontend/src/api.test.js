import { apiUrl } from './api';

test('builds API URLs from the configured backend origin', () => {
  expect(apiUrl('/me', 'https://packing-helper-backend.onrender.com/')).toBe(
    'https://packing-helper-backend.onrender.com/api/me'
  );
});
