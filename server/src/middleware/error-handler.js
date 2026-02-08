export function errorHandlerMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = Number.isInteger(error?.status) ? error.status : 500;
  const code = error?.code || (status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
  const message = status >= 500 ? "Erro interno do servidor" : error?.message || "Erro na requisição";

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error("[server:error]", {
      requestId: req.requestId,
      stack: error?.stack,
    });
  }

  res.status(status).json({
    error: {
      code,
      message,
      requestId: req.requestId,
    },
  });
}
