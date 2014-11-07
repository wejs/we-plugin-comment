/**
 * wejs init hook how runs in sails.js initialize hook
 *
 * use it to plug some feature on sails.js hooks like passport in before hook
 *
 * @param  {object}   sails current sails.js object
 * @param  {Function} cb    callback
 */
module.exports = function initPlugin(sails, cb) {

  checkRequirements(sails);

  // Always remember to run the callback
  cb();
};

function checkRequirements(sails) {
  var appPath = sails.config.appPath;

  // check if sails-context is instaled
  require(appPath + '/node_modules/sails-context/package.json');
}
