import { fireEvent, render, screen } from '@testing-library/react';
import BackToTop from './BackToTop';

test('shows the button after scrolling down and hides it near the top', () => {
  const { container } = render(<BackToTop />);
  const button = container.querySelector('.back-to-top');

  expect(button).toHaveAttribute('aria-hidden', 'true');
  expect(button).toHaveAttribute('tabindex', '-1');

  Object.defineProperty(window, 'scrollY', { configurable: true, value: 201 });
  fireEvent.scroll(window);

  expect(button).toHaveAttribute('aria-hidden', 'false');
  expect(button).toHaveAttribute('tabindex', '0');
  expect(button).toHaveClass('is-visible');

  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  fireEvent.scroll(window);

  expect(button).toHaveAttribute('aria-hidden', 'true');
  expect(button).not.toHaveClass('is-visible');
});

test('scrolls smoothly to the top when clicked', () => {
  const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(<BackToTop />);

  Object.defineProperty(window, 'scrollY', { configurable: true, value: 201 });
  fireEvent.scroll(window);
  fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));

  expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  scrollTo.mockRestore();
});
