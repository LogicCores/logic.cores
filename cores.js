
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

        var Context = function (config) {
            var self = this;

            self.adapters = {};

            Object.keys(config).forEach(function (coreName) {

                if (!LIB.Cores[coreName]) {
                    console.error("LIB.Cores", LIB.Cores);
                    throw new Error("Logic core '" + coreName + "' not loaded!");
                }
                if (typeof LIB.Cores[coreName].forContexts !== "function") {
                    console.error("LIB.Cores['" + coreName + "']", LIB.Cores[coreName]);
                    throw new Error("Logic core '" + coreName + "' does not export 'forContexts()'!");
                }
                // TODO: When on server let 0-server.api subclass load core from disk instead of 'LIB'
    			self[coreName] = new (LIB.Cores[coreName].forContexts(self).Context)(config[coreName].config || {});

    			self.adapters[coreName] = {}
    			Object.keys(config[coreName].adapters).forEach(function (adapterAlias) {
    			    self.adapters[coreName][adapterAlias] = LIB.Cores[coreName].adapters[
    			        config[coreName].adapters[adapterAlias]
    			    ].spin(self[coreName])
    			});
            });
        }

        return {
            Context: Context
        }
    }

    return exports;
}
