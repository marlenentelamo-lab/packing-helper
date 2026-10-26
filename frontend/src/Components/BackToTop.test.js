import { fireEvent, render, screen } from '@testing-library/react';
import BackToTop from './BackToTop';

test('scrolls smoothly to the top when clicked', () => {
  const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(<BackToTop />);

  fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));

  expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  scrollTo.mockRestore();
});
