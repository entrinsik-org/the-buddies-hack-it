'use strict';
exports.register = function(server,opts,next){
    server.drivers('flow',require('./lib'));
    next();
};
exports.register.attributes={name:'SumOfArray'};