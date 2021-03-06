/**
 * CommentController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

const notifications = require('../../lib/notifications.js');

module.exports = {
  /**
   * Default count action
   *
   * Built for only send count as JSON
   *
   * @param  {Object} req express.js request
   * @param  {Object} res express.js response
   */
  count(req, res) {
    return res.locals.Model
    .count(res.locals.query)
    .then( (count)=> {
      res.status(200).send({ count: count });
    })
    .catch(res.queryError);
  },

  getCommentForm(req, res) {
    res.locals.commentRecord = {};

    res.locals.commentRecord.modelName = req.params.modelName;
    res.locals.commentRecord.modelId = req.params.modelId;

    res.ok();
  },
  create(req, res) {
    const comment = req.body;
    if (req.user) comment.creatorId = req.user.id;

    const we = req.we;

    res.locals.Model
    .create(comment)
    .then( (newInstance)=> {
      newInstance
      .getCreator()
      .then( (creator)=> {
        newInstance.creator = creator;

        res.locals.data = newInstance;

        // render comment html record
        let recordHTML = req.we.view.renderTemplate(
          'comment/findOne',
          res.locals.theme,
          res.locals
        );

        if (we.io) {
          let room = 'comment:'+comment.modelName+':'+comment.modelId;
          we.io.sockets.emit('an event sent to all connected clients');
          we.io.sockets.in(room).emit('comment:created', {
            record: newInstance,
            html: recordHTML
          });
        }

        notifications.notify(req, res, newInstance, creator);

        if (req.accepts('html') && req.query.contentOnly) {
          res.send(recordHTML);
        } else {
          res.created(newInstance);
        }

        return null;
      })
      .catch(res.queryError);
    })
    .catch(res.queryError);
  },

  findOne(req, res) {
    if (!res.locals.data || !req.we.db.models[res.locals.data.modelName]) {
      return res.notFound();
    }

    req.we.db.models[res.locals.data.modelName]
    .findOne({
      where: {
        id: res.locals.data.modelId
      }
    })
    .then( (record)=> {
      if (!record) {
        res.notFound();
      } else {
        res.goTo( record.getUrlPathAlias() );
      }
    })
    .catch(res.queryError);
  },

  find(req, res) {
    let modelName = req.query.modelName;
    let modelId = req.query.modelId;

    if (!modelName || !modelId) {
      // load all comments only if user can manage_all_comments
      if (!req.we.acl.canStatic('manage_all_comments', req.userRoleNames)) {
        return res.forbidden();
      }
    } else {
      res.locals.query.where.modelName = modelName;
      res.locals.query.where.modelId = modelId;
    }

    res.locals.Model
    .findAll(res.locals.query)
    .then( (comments)=> {
      res.locals.data = comments;

      res.locals.responseType = 'modal';

      if (req.query.teaserList) {
        res.locals.template = 'comment/teaser-list';
      }

      if (req.query.contentOnly) {
        res.send(req.we.view.renderTemplate(
          'comment/teaser-list',
          res.locals.theme,
          res.locals
        ));
      } else {
        res.ok();
      }

      return null;
    })
    .catch(res.queryError);
  }
};
