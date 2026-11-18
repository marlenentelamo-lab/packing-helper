import { useEffect, useState } from 'react';

const SHOW_AFTER_SCROLL_Y = 200;

function BackToTop() {
  const [isVisible, setIsVisible] = useState(() => window.scrollY > SHOW_AFTER_SCROLL_Y);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > SHOW_AFTER_SCROLL_Y);
    };

    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  return (
    <button
      type="button"
      className={`back-to-top btn btn-edit${isVisible ? ' is-visible' : ''}`}
      aria-label="Back to top"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ↑ Back to top
    </button>
  );
}

export default BackToTop;
