
exports.boot = function (LIB, config) {

    // TODO: Use own module is this one is not available.
    const CONTEXT_CORE = require("../../cores/context/0-server.api").forLib(LIB);

    var contexts = {};
    var contextCore = CONTEXT_CORE.forContexts(contexts);
	contexts.context = new contextCore.Context(config || {});
	contexts.adapters = {
		context: {
			server: contextCore.adapters["logic.cores"].spin(contexts.context)
		}
	};

    return contexts;
}
