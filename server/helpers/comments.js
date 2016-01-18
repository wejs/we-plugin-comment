/**
 * We {{comments}}  helper
 *
 * usage:  {{{comments comments=record.metadata,comments count=record.metadata.commentCount locals=this}}}
 */

module.exports = function(we) {
  return function helper() {
    var options = arguments[arguments.length-1];

    // // helper attibutes is avaible at
    // // options.hash
    // // if call {{comments  time="value"}} the value will be at options.hash.time


    // DO your logic here


    return we.view.renderTemplate('comment/comments', options.hash.locals.theme, {
      comments: options.hash.comments,
      count: options.hash.count,
      modelName: options.hash.modelName,
      modelId: options.hash.modelId,
      commentRecord: {
        modelName: options.hash.modelName,
        modelId: options.hash.modelId,
      },
      locals: options.hash.locals
    });
  }
}