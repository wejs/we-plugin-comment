/**
 * CommentController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  getCommentForm: function getCommentForm(req, res) {
    res.locals.commentRecord = {};

    res.locals.commentRecord.modelName = req.params.modelName;
    res.locals.commentRecord.modelId = req.params.modelId;

    res.ok();
  },
  create: function create(req, res) {
    var comment = req.body;
    if (req.user) comment.creatorId = req.user.id;

    var we = req.we;

    res.locals.Model.create(comment)
    .then(function (newInstance) {
      newInstance.getCreator().then(function (creator){
        newInstance.creator = creator;

        res.locals.data = newInstance;

        // render comment html record
        var recordHTML = req.we.view.renderTemplate(
          'comment/findOne',
          res.locals.theme,
          res.locals
        );

        if (we.io) {
          var room = 'comment:'+comment.modelName+':'+comment.modelId;
          we.io.sockets.emit('an event sent to all connected clients');
          we.io.sockets.in(room).emit('comment:created', {
            record: newInstance,
            html: recordHTML
          });
        }

        if (req.accepts('html') && req.query.contentOnly) {
          res.send(recordHTML);
        } else {
          res.created(newInstance);
        }

      }).catch(res.queryError);
    }).catch(res.queryError);
  },

  findOne: function findOne(req, res) {
    if (!res.locals.data || !req.we.db.models[res.locals.data.modelName])
      return res.notFound();

    req.we.db.models[res.locals.data.modelName].findOne({
      where: {
        id: res.locals.data.modelId
      }
    })
    .then(function (record) {
      if (!record) return res.notFound();

      res.goTo( record.getUrlPathAlias() );
    }).catch(res.queryError);
  },

  find: function findRecords (req, res) {
    var modelName = req.query.modelName;
    var modelId = req.query.modelId;

    res.locals.query.where.modelName = modelName;
    res.locals.query.where.modelId = modelId;

    res.locals.query.order.unshift([
      'id', 'desc'
    ]);

    res.locals.Model.findAll(res.locals.query)
    .then(function(comments) {

      if (req.query.teaserList) {
        res.locals.template = 'comment/teaser-list';
      }

      return res.ok(comments);
    }).catch(res.queryError);
  }
};
