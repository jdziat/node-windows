module.exports = {

    /**
     * @method generateXml
     * Generate the XML for the winsw configuration file.
     * @param {Object} config
     * The config object must have the following attributes:
     *
     * - *id* This is is how the service is identified. Alphanumeric, no spaces.
     * - *name* The descriptive name of the service.
     * - *script* The absolute path of the node.js script. i.e. `C:\path\to\myService.js`
     *
     * Optional attributes include
     *
     * - *description* The description that shows up in the service manager.
     * - *flags* Any flags that should be passed to node. Defaults to `--harmony` to add ES6 support.
     * - *logmode* Valid values include `rotate` (default), `reset` (clear log), `roll` (move to .old), and `append`.
     * - *logpath* The absolute path to the directory where logs should be stored. Defaults to the current directory.
     * - *dependencies* A comma delimited list or array of process dependencies.
     * - *env* A key/value object or array of key/value objects containing
     * environment variables to pass to the process. The object might look like `{name:'HOME',value:'c:\Windows'}`.
     */
    generateXml: function(config) {
        var X2JS = require('x2js');
        var x2js = new X2JS();
        // Set default values
        config = config || {};
        config.description = config.description || '';
        config.flags = config.flags || '--harmony';
        config.logmode = 'rotate';
        config.execPath = config.execPath || process.execPath;

        var jsonXML = {};

        // Initial template
        jsonXML.service = {
            "id": config.id,
            "name": config.name,
            "description": config.description,
            "executable": config.execPath,
            "arguments": config.flags + ' ' + config.script,
            "logmode": config.logmode
        }


        // Optionally add log path
        if (config.logpath) {
            jsonXML.service.logpath = config.logpath;
        }

        // Optionally add service dependencies
        if (config.dependencies) {
            config.dependencies = (config.dependencies instanceof Array == true) ? config.dependencies : config.dependencies.split(',');
            jsonXML.service.dependencies = []

            config.dependencies.forEach(function(dep) {
                var depend = {
                    "depend": dep.trim()
                }
                jsonXML.service.dependencies.push(depend);
            });
        }
        jsonXML.service.env = [];

        // Optionally add environment values
        if (config.env) {
            config.env = (config.env instanceof Array == true) ? config.env : [config.env];
            config.env.forEach(function(env) {
                jsonXML.service.env.push({ '_name': env.name, '_value': env.value });

            });
        }
        var xmlAsStr = x2js.js2xml(jsonXML);
        return xmlAsStr;
    },

    /**
     * @method createExe
     * Create the executable
     * @param {String} name
     * The alphanumeric string (spaces are stripped) of the `.exe` file. For example, `My App` generates `myapp.exe`
     * @param {String} [dir=cwd]
     * The output directory where the executable will be saved.
     * @param {Function} [callback]
     * The callback to fire upon completion.
     */
    createExe: function(name, dir, callback) {
        var fs = require('fs'),
            p = require('path');

        if (typeof dir === 'function') {
            callback = dir;
            dir = null;
        }

        dir = dir || process.cwd();

        var origin = p.join(__dirname, '..', 'bin', 'winsw', 'x' + (require('os').arch().indexOf('64') > 0 ? '64' : '86'), 'winsw.exe'),
            dest = p.join(dir, name.replace(/[^\w]/gi, '').toLowerCase() + '.exe'),
            data = fs.readFileSync(origin, { encoding: 'binary' });

        fs.writeFileSync(dest, data, { encoding: 'binary' });
        callback && callback();
        //require('child_process').exec('Icacls "'+dest+'" /grant Everyone:(F)',callback)
        //require('child_process').exec('copy "'+origin+'" /y /v /b "'+dest+'" /b',callback);
    }

}
