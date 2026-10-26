function ensureAuth(req, res, next) {
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }

  return res.status(401).json({ message: "You must be logged in" });
}

module.exports = { ensureAuth };