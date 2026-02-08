import crypto from "node:crypto";

export function requestIdMiddleware(req, res, next) {
  const incoming = req.header("x-request-id");
  req.requestId = incoming || crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}
