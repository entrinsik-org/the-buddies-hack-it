'use strict';
const _ = require('lodash');

module.exports=function(funct) {
    return {

        id: funct.name,
        name: _.startCase(funct.name),
        group: 'Add Field',
        labelExpr: `{{ field.label || data.label }}`,
        description: funct.description || 'This is a function',
        image: '/assets/flow-steps/images/counter.svg',
        color: 'green',
        validate: function (opts) {
            return true;
        },
        through: function (stream, opts) {
            return stream.tap(r => _.set(r, opts.alias, _.sum(r[opts.arrayField])));
        },
        editor: {
            formly: [
                {
                    key: 'label',
                    type: 'formly-flow-label-alias',
                    defaultValue: 'Total Of Array'
                },
                {
                    key: 'arrayField',
                    type: 'formly-flow-field-select',
                    templateOptions: {
                        label: 'Array Field to Total'
                    }
                }
            ]
        }

    }
}