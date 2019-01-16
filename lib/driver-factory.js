'u                                                                                                                                           strict';
const _ = require('lodash');
const vm = require('vm');

/**
 * Look in the function for hints for icon and color
 * Usage:
 *     Put in the function body
 *     "icon room"
 *     "color red"
 * @param Function funct the function being saved 
 * @param String hint which hint to use icon|color
 */
const scanForHint = (funct,hint) => {
    //hack, but it IS hackathon
    const re = new RegExp(`"${hint}(.*?)"`);
    const match = re.exec(funct.script);
    if(match && match.length && match.length >= 2) {
        return match[1].trim();
    }
}
//the default color palette for deriving color from function.name
const colors = ['blue', 'lightBlue', 'green', 'lightGreen', 'teal', 'purple', 'deepPurple', 'orange', 'cyan', 'indigo'];
/**
 * Picks from colors based on the function name
 * @param String name 
 */
const generateColor = name => colors[name.split('').reduce((a,c,i) => a+c.codePointAt(0),0) % colors.length];

/**
 * Creates a formly form based on the parameters of the function
 * @param Function funct 
 */
const formlyEditorGenerator = (funct) => {
    const form = {};
    form.formly = [];
    form.formly[0] =  {
        key: 'label',
        type: 'formly-flow-label-alias',
        defaultValue: _.startCase(funct.name)
    };
    //we wanted to filter the fields but the types on the fields do not correspond to the parameter types
    //needs a better form (ultimately allowing scalars for parameters)
    const params = funct.params.map((p,i) => {
        const templateOptions = {}
        templateOptions.label = p.label || `Parameter ${i+1}`;
        return {
            key: `param_${p.id}`,
            type: 'formly-flow-field-select',
            templateOptions: templateOptions
        }
    });
    form.formly = form.formly.concat(params);
    return form;
}

/**
 * Creates flow drivers based on Saved Functions with namespace 'informer-flow'
 */
class DriverFactory {
    /**
     * Creates the driver
     * @param {Function} funct 
     */

    createDriver(funct) {
        return {
            id: funct.name,
            name: _.startCase(funct.name),
            group: 'Custom Flows',
            labelExpr: `{{ field.label || data.label }}`,
            description: funct.description || 'This is a function',
            materialIcon: scanForHint(funct,'icon') || 'extension',
            color: scanForHint(funct,'color') || generateColor(funct.name),
            validate: function (opts) {
                //probably needs to check for mandatory things
                return opts;
            },
            post: function (qr, opts) {
                const self = this;
                const alias = opts.alias;
                const label = opts.label;
    
                try {
                    //create a script from the function.script surrounding with a generic function that is immediately called
                    const script = vm.createScript('(function(){'+funct.script+'})()');
                    const ctx = qr.scriptContext;
                    const params = funct.params;
                    qr.field(alias).label(label);
    
                    qr.through(function (stream) {
                        return stream.tap(function (r) {
                            try {
                                //for each param, there is a field value in opts that is the alias of the column in r
                                //get that column in r, and set the value of the column in r to param.id in ctx
                                //so that param will have the correct value when the script is executed
                                if(params) params.forEach(p => ctx[p.id] = r[opts[`param_${p.id}`]]);
                                //set the script result to the alias of our flow field
                                r[alias] = script.runInContext(ctx, { timeout: 500 });
                            } catch (err) {
                                r[alias] = null;
                                self.error(r, opts.label || 'calculated column', err.message);
                            }
                        });
                    });
                } catch (err) {
                    log.warn(`Error compiling script: "${opts.script}"`, err.message);
                    qr.through(function (stream) {
                        return stream.tap(r => {
                            r[alias] = null;
                            self.error(r, label || 'Calculated column', `<pre>${err.stack.split('\n').slice(1, 4).join('\n')}</pre>`);
                        });
                    });
                }
            },
            editor: formlyEditorGenerator(funct)
    
        }
    }

}


exports.DriverFactory = DriverFactory;