function BackToTop() {
  return (
    <button
      type="button"
      className="back-to-top btn btn-primary"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ↑ Back to top
    </button>
  );
}

export default BackToTop;
