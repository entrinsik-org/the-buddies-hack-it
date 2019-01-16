'use strict';
const DriverFactory = require('./lib/driver-factory').DriverFactory;

exports.register = function (server, opts, next) {
    const driverFactory = new DriverFactory();
    server.on('start', async () => {
        const FunctionModel = server.app.db.model('Function');
        const flowFunctions = await FunctionModel.findAll({ where: { namespace: 'informer-flow' } });
        const flowDrivers = flowFunctions.map(f => driverFactory.createDriver(f));
        server.drivers('flow', flowDrivers);

        FunctionModel.hook('afterCreate', funct => {
            if (funct.namespace === 'informer-flow') {
                const driver = driverFactory.createDriver(funct);
                server.driver('flow', driver);
            }
        });

        FunctionModel.hook('afterUpdate', funct => {
            const flowDriverManager = server.driverManager('flow');
            if (funct.previous('namespace') === 'informer-flow') 
                flowDriverManager.remove(funct.previous('name'));
            if (funct.namespace === 'informer-flow') 
                flowDriverManager.add(driverFactory.createDriver(funct));
        });

        FunctionModel.hook('afterDestroy', funct => {
            if (funct.namespace === 'informer-flow') {
                const flowDriverManager = server.driverManager('flow');
                flowDriverManager.remove(funct.name);
            }
        });

    });
    next();
};

exports.register.attributes = { name: 'CustomFlows' };