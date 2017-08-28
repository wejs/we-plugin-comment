/**
 * Widget comment-form main file
 *
 * See https://github.com/wejs/we-core/blob/master/lib/class/Widget.js for all Widget prototype functions
 */

module.exports = function (projectPath, Widget) {
  var widget = new Widget('comment-form', __dirname);

  widget.viewMiddleware = function viewMiddleware(widget, req, res, next) {
    if (res.locals.model && res.locals.id) {
      widget.haveRecord = true;
    } else {
      widget.hide = true;
    }
    next();

    return null;
  }

  return widget;
};