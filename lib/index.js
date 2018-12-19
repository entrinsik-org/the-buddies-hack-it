'use strict';

const joi = require('joi');
const _ = require('lodash');

const schema = joi.object({
    alias: joi.string().required(),
    label: joi.string(),
    arrayField: joi.string().required()
});

module.exports = {
    id: 'totalOfArray',
    name: 'Total of Array',
    group: 'Add Field',
    labelExpr: `{{ field.label || data.label }}`,
    description: 'Add field that totals an array.',
    image: '/assets/flow-steps/images/counter.svg',
    color: 'green',
    validate: function (opts) {
        return joi.attempt(opts, schema);
    },
    post: function (qr, opts) {
        qr.field(opts.alias).label(opts.label).type('double');
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
            
};