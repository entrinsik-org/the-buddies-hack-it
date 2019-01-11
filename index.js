'use strict';
const driverfactory = require('./lib/driverfactory');

exports.register = function(server,opts,next){
    //need to server on start handler
    //get all the functions
    //findall with namespace informer-flow
    //attach each one to the server flow drivers
    //server.drivers('flow',require('./lib'));
    server.on ('start',async () => {
       const FunctionModel = server.app.db.model('Function');
       const flowFunctions = await FunctionModel.findAll({where:{namespace:'informer-flow'}});
       const flowDrivers = flowFunctions.map(f=>driverfactory(f));
       server.drivers('flow', flowDrivers);
       //add hook to function save
       FunctionModel.hook('afterSave',function(funct,opts){
        server.drivers('flow', driverfactory(funct));
       })
    });
    next();
};
exports.register.attributes={name:'SumOfArray'};