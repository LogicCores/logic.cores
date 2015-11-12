
/*

TODO: Implement with ccjson runtime loader and factor into other cores.

Requirements:

  1. Global Singleton
  2. Multiple instances
  3. Inhert from instance

Use-Case Example:

  * Single context to represent all page entities within a single parent context (epoch)
  * Multiple contexts to represent each page
  * Initialize a schema of sub-contexts for each page ...

*/


exports.forLib = function (LIB) {

    var exports = {};

    exports.spin = function (context) {

        var Context = function (config, parentContext) {
            var self = this;

            self.config = config;

            self.aspects = (parentContext && Object.create(parentContext.aspects)) || new function () {};
            self.aspects.context = self;

            self.adapters = (parentContext && Object.create(parentContext.adapters)) || new function () {};
            self.adapters["context.server"] = self;

            if (config.aspects) {
                Object.keys(config.aspects).forEach(function (coreName) {
                    if (!LIB.Cores[coreName]) {
                        console.error("LIB.Cores", LIB.Cores);
                        throw new Error("Logic core '" + coreName + "' not loaded!");
                    }
                    if (typeof LIB.Cores[coreName].forContexts !== "function") {
                        console.error("LIB.Cores['" + coreName + "']", LIB.Cores[coreName]);
                        throw new Error("Logic core '" + coreName + "' does not export 'forContexts()'!");
                    }
                    // TODO: When on server let 0-server.api subclass load core from disk instead of 'LIB'
                    function getConfig () {
                        var coreConfig = config.aspects[coreName].config;
                        if (typeof coreConfig === "function") {
                            coreConfig = coreConfig();
                        }
                        return coreConfig || {};
                    }
        			self.aspects[coreName] = new (LIB.Cores[coreName].forContexts(self).Context)(getConfig());

                    if (config.aspects[coreName].adapters) {
            			Object.keys(config.aspects[coreName].adapters).forEach(function (adapterAlias) {
            			    self.adapters[adapterAlias] = LIB.Cores[coreName].adapters[
            			        config.aspects[coreName].adapters[adapterAlias]
            			    ].spin(self.aspects[coreName])
            			});
                    }
                });
            }

            self.clone = function (cloneConfig) {
                
                // TODO: Setup inheritance references in all aspects and adapters
                //       so they are aware of the runtime stack tree.

                return new Context(cloneConfig, self);
            }
        }
        Context.prototype.setAdapterAPI = function (alias, api) {
            if (typeof this.adapters[alias] !== "undefined") {
                if (
                    !this.adapters[alias].promise ||
                    !this.adapters[alias].promise.isPending()
                ) {
                    console.error("this.adapters", this.adapters);
                    throw new Error("Adapter API with alias '" + alias + "' already set for instance!");
                }
            } else {
                this.adapters[alias] = LIB.Promise.defer();
            }
//console.log("fulfill adapter", alias);            
            this.adapters[alias].resolve(api);
            this.adapters[alias] = api;
        }
        Context.prototype.getAdapterAPI = function (alias) {
            if (!this.adapters[alias]) {
                this.adapters[alias] = LIB.Promise.defer();
            }
            if (this.adapters[alias].promise) {
                return this.adapters[alias].promise;
            }
            return LIB.Promise.resolve(this.adapters[alias]);
        }
        Context.prototype.setAspectConfig = function (coreName, config) {
            // If aspect already exists we do not touch it.
            if (this.aspects[coreName]) {
                return;
            }
			this.aspects[coreName] = new (LIB.Cores[coreName].forContexts(this).Context)(config);
        }

        return {
            Context: Context
        }
    }

    return exports;
}
