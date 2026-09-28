import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the navbar', () => {
  render(<App />);
  const linkElement = screen.getByText(/packing helper/i);
  expect(linkElement).toBeInTheDocument();
});
