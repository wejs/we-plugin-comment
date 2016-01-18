/**
 * CommentController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

module.exports = {
  getCommentForm: function(req, res) {
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

  findOne: function (req, res) {
    if (!res.locals.record) return res.notFound();
    res.ok();
  },

  find: function findRecords (req, res) {
    var modelName = req.query.modelName;
    var modelId = req.query.modelId;

    res.locals.query.where.modelName = modelName;
    res.locals.query.where.modelId = modelId;

    res.locals.Model.findAll(res.locals.query)
    .then(function(comments) {
      return res.ok(comments);
    })
  },

  add: function (req, res) { return res.notFound(); },
  remove: function (req, res) { return res.notFound(); }
};
