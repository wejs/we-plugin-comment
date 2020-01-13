/**
 * Widget comment-form main file
 *
 * See https://github.com/wejs/we-core/blob/master/lib/class/Widget.js for all Widget prototype functions
 */

module.exports = function (projectPath, Widget) {
  const widget = new Widget('comment-form', __dirname);

  widget.viewMiddleware = function (w, req, res, next) {
    if (res.locals.model && res.locals.id) {
      w.haveRecord = true;
    } else {
      w.hide = true;
    }
    next();
  }

  return widget;
};