const authMap = new Map([
  ["alice-token", { id: "1", role: "customer" }],
  ["bob-token", { id: "2", role: "customer" }],
  ["admin-token", { id: "3", role: "admin" }],
  ["alice-expired-token", { id: "1", role: "customer", expired: true }],
]);

// Function to validate the token
export function checkAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized!" });
  }

  const token = auth.slice("Bearer ".length);
  const user = authMap.get(token);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized!" });
  } else if (user?.expired) {
    return res.status(401).json({ error: "Token expired!" });
  }

  req.user = user;
  next();
}

// validate if the token passed in has sufficient permissions
// 403 will be returned if user role is not admin and
export function requirePermissions(inputRole) {
  return (req, res, next) => {
    if (
      req.user?.role != "admin" &&
      (req.user.id !== req.params.id || req.user?.role !== inputRole)
    ) {
      return res
        .status(403)
        .json({ error: "User has insufficient permissions!" });
    }
    next();
  };
}
