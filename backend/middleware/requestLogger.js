const crypto = require("crypto");

// One JSON line per request, and an id that ties a user's complaint to that line.
// The id goes back in every error response, so "it failed, here's the code" is enough to find the log.
// Never logs bodies, query strings or headers: they carry passwords, tokens and email addresses.
function requestLogger(req, res, next) {
  req.reqId = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.reqId);
  const started = Date.now();

  res.on("finish", () => {
    console.log(JSON.stringify({
      event: "request",
      reqId: req.reqId,
      method: req.method,
      // The route pattern ("/offer/:id"), not the actual id, so lines group by endpoint
      path: req.route ? `${req.baseUrl}${req.route.path}` : req.path,
      status: res.statusCode,
      ms: Date.now() - started,
      userId: req.user?.userId,
    }));
  });

  next();
}

// The last handler: turns anything thrown (Express 5 forwards async errors here) into JSON carrying
// the same reqId. Mongo's duplicate-key error is a conflict, not a server fault.
function errorHandler(err, req, res, _next) {
  const duplicate = err.code === 11000;
  const status = duplicate ? 409 : err.status || 500;
  console.error(JSON.stringify({
    event: "error",
    reqId: req.reqId,
    path: req.path,
    status,
    name: err.name,
    message: err.message,
  }));
  if (err.stack && !duplicate) console.error(err.stack);

  res.status(status).json({
    success: false,
    message: duplicate ? "That already exists" : "Something went wrong",
    reqId: req.reqId,
  });
}

module.exports = { requestLogger, errorHandler };
