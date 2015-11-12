
exports.forLib = function (LIB) {
    var ccjson = this;

    // TODO: Use own module is this one is not available.
    const CONTEXTS = require("./0-server.boot").boot(LIB);


    return LIB.Promise.resolve({
        forConfig: function (defaultConfig) {

            var config = {};
            LIB._.merge(config, defaultConfig);

            // Initialize a context that will be shared with all others in the runtime.

            var context = new CONTEXTS.adapters["context.server"].Context(config);

            var Entity = function (instanceConfig) {
                var self = this;

                var config = {};
                LIB._.merge(config, defaultConfig);
                LIB._.merge(config, instanceConfig);

                // Initialize a context that will be shared with all aspect instances.

                var entityContext = context.clone(config);

                self.AspectInstance = function (aspectConfig) {

                    var config = {};
                    LIB._.merge(config, defaultConfig);
                    LIB._.merge(config, instanceConfig);
                    LIB._.merge(config, aspectConfig);
                    config = ccjson.attachDetachedFunctions(config);
                    
                    // Initialize a context that will be shared with all aspect instance accessors.
    
                    var aspectContext = entityContext.clone(config);
                    
                    aspectContext.setAdapterAPI = function (api) {
                        if (!aspectContext.config.adapter) return;
                        return entityContext.setAdapterAPI(
                            aspectContext.config.adapter,
                            api
                        )
                    }
                    aspectContext.getAdapterAPI = function (alias) {
                        return entityContext.getAdapterAPI(alias)
                    }
                    aspectContext.setAspectConfig = function (aspectConfig) {
                        if (!config.aspect) return;
                        return entityContext.setAspectConfig(
                            config.aspect,
                            aspectConfig
                        )
                    }

                    return LIB.Promise.resolve({
                        api: function () {
                            return LIB.Promise.resolve(
                                ccjson.makeDetachedFunction(
                                    function () {
                                        return aspectContext;
                                    }
                                )
                            );
                        },
                        app: function () {
                            return LIB.Promise.resolve(
                                ccjson.makeDetachedFunction(
                                    function (req, res, next) {
                                        if (!req.context2) {
                                            req.context2 = entityContext;
                                        }
                                        return next();
                                    }
                                )
                            );
                        }
                    });
                }

            }
            Entity.prototype.config = defaultConfig;

            return Entity;
        }
    });
}
