/**
 * We {{comments}}  helper
 *
 * usage:  {{{comments modelName="post" modelId=record.id comments=record.metadata.comments
 count=record.metadata.commentCount locals=this}}}
 *
 */

module.exports = function(we) {
  return function helper() {
    var options = arguments[arguments.length-1];

    return we.view.renderTemplate('comment/comments', options.hash.locals.theme, {
      comments: options.hash.comments,
      count: options.hash.count,
      modelName: options.hash.modelName,
      modelId: options.hash.modelId,
      commentRecord: {
        modelName: options.hash.modelName,
        modelId: options.hash.modelId,
      },
      locals: options.hash.locals,
      haveMore: ( ( options.hash.comments.length || 0 ) < options.hash.count )
    });
  }
}