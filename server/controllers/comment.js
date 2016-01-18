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

    res.locals.Model.create(comment)
    .then(function (newInstance) {
      res.locals.data = newInstance;

      if (res.locals.responseType == 'modal') {
        res.locals.template = 'comment/findOne';
        res.ok();
      } else {
        res.created(newInstance);
      }
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
